"""
FastAPI wrapper around the Gold Sentiment project.

This does NOT replace Dashboard/app.py — it reuses the exact same
loading / feature-engineering / prediction logic and exposes it as
JSON endpoints so a separate React frontend can consume it.

Run from the project root's Dashboard folder (same place app.py lives),
or adjust PROJECT_ROOT below if you place this file elsewhere:

    pip install fastapi uvicorn python-multipart
    uvicorn api:app --reload --port 8000

Then the API is available at http://127.0.0.1:8000
Interactive docs (auto-generated) at http://127.0.0.1:8000/docs
"""

import os
import warnings

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

warnings.filterwarnings("ignore")

# ============================================================
# CONFIGURATION  (same paths as Dashboard/app.py)
# ============================================================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

DATA_PATH = os.path.join(PROJECT_ROOT, "data", "final_dataset.csv")
NEWS_PATH = os.path.join(PROJECT_ROOT, "data", "sentiment_news.csv")
MODEL_PATH = os.path.join(PROJECT_ROOT, "Models", "lstm_gold.pt")
PREDICTIONS_PATH = os.path.join(PROJECT_ROOT, "Models", "test_predictions.csv")

FRED_COLS = [
    "Federal_Funds_Rate",
    "CPI",
    "Unemployment",
    "GDP",
    "PCE",
    "Treasury10Y",
]

# ============================================================
# MODEL ARCHITECTURE — must exactly match Models/LSTM.py
# ============================================================


class GoldLSTM(nn.Module):
    def __init__(self, input_size):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=64,
            num_layers=2,
            batch_first=True,
            dropout=0.20,
        )
        self.dropout = nn.Dropout(0.25)
        self.fc1 = nn.Linear(64, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        output, _ = self.lstm(x)
        output = output[:, -1, :]
        output = self.dropout(output)
        output = self.fc1(output)
        output = self.relu(output)
        output = self.fc2(output)
        return output


# ============================================================
# LOADERS (module-level cache — loaded once at startup)
# ============================================================

_state = {}


def load_dataset():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found:\n{DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    if "date" not in df.columns:
        raise ValueError("final_dataset.csv has no 'date' column.")
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)
    return df


def load_news():
    if not os.path.exists(NEWS_PATH):
        return pd.DataFrame()
    news = pd.read_csv(NEWS_PATH)
    if "date" in news.columns:
        news["date"] = pd.to_datetime(
            news["date"], errors="coerce", utc=True
        ).dt.tz_localize(None)
    return news


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found:\n{MODEL_PATH}")
    checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    feature_cols = checkpoint["feature_cols"]
    seq_len = int(checkpoint["seq_len"])
    threshold = float(checkpoint["threshold"])
    model = GoldLSTM(len(feature_cols))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, checkpoint, feature_cols, seq_len, threshold


def load_test_predictions():
    if not os.path.exists(PREDICTIONS_PATH):
        return pd.DataFrame()
    pred = pd.read_csv(PREDICTIONS_PATH)
    if "date" in pred.columns:
        pred["date"] = pd.to_datetime(pred["date"], errors="coerce")
    return pred


def prepare_features(df):
    data = df.copy()
    data["price_change"] = data["Close"].pct_change() * 100
    data["price_change_3"] = data["Close"].pct_change(3) * 100
    data["price_change_5"] = data["Close"].pct_change(5) * 100
    data["ma_cross"] = data["MA7"] - data["MA20"]
    data["sent_momentum"] = data["sentiment_score"].diff()
    return data


def make_next_prediction(df, model, feature_cols, seq_len, threshold, scaler):
    data = prepare_features(df)
    usable = data.dropna(subset=feature_cols).copy()
    if len(usable) < seq_len:
        raise ValueError(f"At least {seq_len} complete rows are required.")
    latest = usable[feature_cols].iloc[-seq_len:]
    scaled = scaler.transform(latest)
    tensor = torch.tensor(scaled, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logit = model(tensor)
        probability_up = torch.sigmoid(logit).item()
    if probability_up >= threshold:
        direction, confidence = "UP", probability_up
    else:
        direction, confidence = "DOWN", 1 - probability_up
    return direction, confidence, probability_up, usable


def load_everything():
    _state["df"] = load_dataset()
    _state["news"] = load_news()
    model, checkpoint, feature_cols, seq_len, threshold = load_model()
    _state["model"] = model
    _state["checkpoint"] = checkpoint
    _state["feature_cols"] = feature_cols
    _state["seq_len"] = seq_len
    _state["threshold"] = threshold
    _state["scaler"] = checkpoint["scaler"]
    _state["test_predictions"] = load_test_predictions()


# ============================================================
# APP
# ============================================================

app = FastAPI(title="Gold Sentiment API")

# CORS: allow the React dev server (and any origin, for local dev) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    try:
        load_everything()
    except Exception as e:
        # Fail loudly in the server logs but let the app boot, so
        # /docs still loads and the error is visible per-request.
        print("Failed to load project files:", e)


def ensure_loaded():
    if "df" not in _state:
        raise HTTPException(status_code=503, detail="Backend data not loaded yet.")


def clean(value):
    """Convert numpy/pandas scalars to plain JSON-safe values."""
    if value is None:
        return None
    if isinstance(value, (np.floating, float)):
        return None if pd.isna(value) else float(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    return value


# ------------------------------------------------------------
# /api/dashboard
# ------------------------------------------------------------
@app.get("/api/dashboard")
def get_dashboard():
    ensure_loaded()
    df = _state["df"]
    try:
        direction, confidence, probability_up, _ = make_next_prediction(
            df,
            _state["model"],
            _state["feature_cols"],
            _state["seq_len"],
            _state["threshold"],
            _state["scaler"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    latest = df.iloc[-1]

    return {
        "date": latest["date"].strftime("%Y-%m-%d"),
        "price": clean(latest["Close"]),
        "ma7": clean(latest.get("MA7")),
        "ma20": clean(latest.get("MA20")),
        "volatility": clean(latest.get("volatility")),
        "momentum": clean(latest.get("momentum")),
        "sentiment_score": clean(latest.get("sentiment_score", 0)),
        "article_count": clean(latest.get("article_count", 0)),
        "prediction": direction,
        "confidence": clean(confidence),
        "probability_up": clean(probability_up),
        "threshold": clean(_state["threshold"]),
        "data_start": df["date"].min().strftime("%Y-%m-%d"),
        "data_end": df["date"].max().strftime("%Y-%m-%d"),
        "seq_len": _state["seq_len"],
        "n_features": len(_state["feature_cols"]),
    }


# ------------------------------------------------------------
# /api/price
# ------------------------------------------------------------
@app.get("/api/price")
def get_price(period: str = Query("180", description="90, 180, 365, or all")):
    ensure_loaded()
    df = _state["df"]

    if period == "90":
        plot_df = df.tail(90)
    elif period == "180":
        plot_df = df.tail(180)
    elif period == "365":
        plot_df = df.tail(365)
    else:
        plot_df = df

    return {
        "dates": plot_df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "close": [clean(v) for v in plot_df["Close"]],
        "ma7": [clean(v) for v in plot_df.get("MA7", pd.Series(dtype=float))],
        "ma20": [clean(v) for v in plot_df.get("MA20", pd.Series(dtype=float))],
    }


# ------------------------------------------------------------
# /api/sentiment
# ------------------------------------------------------------
@app.get("/api/sentiment")
def get_sentiment(days: int = Query(60, ge=1, le=1000)):
    ensure_loaded()
    df = _state["df"]
    news = _state["news"]

    sent_cols = [
        c
        for c in [
            "date",
            "sentiment_score",
            "article_count",
            "positive_count",
            "negative_count",
            "neutral_count",
            "avg_confidence",
        ]
        if c in df.columns
    ]
    daily = df[sent_cols].tail(days).sort_values("date", ascending=False)
    daily_records = []
    for _, row in daily.iterrows():
        rec = {c: clean(row[c]) for c in sent_cols if c != "date"}
        rec["date"] = row["date"].strftime("%Y-%m-%d")
        daily_records.append(rec)

    news_records = []
    if not news.empty:
        possible_cols = ["date", "title", "source", "sentiment", "confidence", "url"]
        display_cols = [c for c in possible_cols if c in news.columns]
        news_sorted = news.sort_values("date", ascending=False) if "date" in news.columns else news
        for _, row in news_sorted[display_cols].head(30).iterrows():
            rec = {}
            for c in display_cols:
                rec[c] = row[c].strftime("%Y-%m-%d") if c == "date" else clean(row[c])
            news_records.append(rec)

    return {
        "daily": daily_records,
        "news": news_records,
        "average_sentiment": clean(df["sentiment_score"].mean())
        if "sentiment_score" in df.columns
        else None,
    }


# ------------------------------------------------------------
# /api/macro
# ------------------------------------------------------------
@app.get("/api/macro")
def get_macro():
    ensure_loaded()
    df = _state["df"]
    available = [c for c in FRED_COLS if c in df.columns]
    if not available:
        raise HTTPException(status_code=404, detail="No FRED features found.")

    latest_row = df.iloc[-1]
    latest = {c: clean(latest_row[c]) for c in available}

    series = {"dates": df["date"].dt.strftime("%Y-%m-%d").tolist()}
    for c in available:
        series[c] = [clean(v) for v in df[c]]

    return {"available": available, "latest": latest, "series": series}


# ------------------------------------------------------------
# /api/model-performance
# ------------------------------------------------------------
@app.get("/api/model-performance")
def get_model_performance():
    ensure_loaded()
    checkpoint = _state["checkpoint"]
    test_predictions = _state["test_predictions"]

    def metric(key):
        val = checkpoint.get(key, None)
        return clean(val)

    predictions = []
    correct = None
    total = None
    if not test_predictions.empty:
        recent = test_predictions.tail(50).sort_values("date", ascending=False)
        for _, row in recent.iterrows():
            rec = {}
            for c in recent.columns:
                rec[c] = row[c].strftime("%Y-%m-%d") if c == "date" else clean(row[c])
            predictions.append(rec)
        if "actual" in test_predictions.columns and "prediction" in test_predictions.columns:
            comparison = test_predictions["actual"] == test_predictions["prediction"]
            correct = int(comparison.sum())
            total = int(len(comparison))

    return {
        "test_accuracy": metric("test_accuracy"),
        "balanced_accuracy": metric("test_balanced_accuracy"),
        "macro_f1": metric("test_macro_f1"),
        "roc_auc": metric("roc_auc"),
        "validation_macro_f1": metric("validation_macro_f1"),
        "predictions": predictions,
        "correct": correct,
        "total": total,
    }


# ------------------------------------------------------------
# /api/about
# ------------------------------------------------------------
@app.get("/api/about")
def get_about():
    ensure_loaded()
    return {
        "seq_len": _state["seq_len"],
        "n_features": len(_state["feature_cols"]),
        "hidden_size": 64,
        "lstm_layers": 2,
        "dropout": "0.20 / 0.25",
        "threshold": clean(_state["threshold"]),
    }
