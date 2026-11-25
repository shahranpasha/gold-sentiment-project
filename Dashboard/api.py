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
import asyncio
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
if __package__:
    # Supports `uvicorn Dashboard.api:app` from the repository root.
    from .data_pipeline import (
        LOCAL_TZ,
        daily_refresh_due,
        init_database,
        latest_runs,
        load_live_news as load_persisted_live_news,
        load_stored_prices,
        news_counts,
        price_coverage,
        query_news,
    )
else:
    # Supports `uvicorn api:app` when launched from Dashboard/.
    from data_pipeline import (
        LOCAL_TZ,
        daily_refresh_due,
        init_database,
        latest_runs,
        load_live_news as load_persisted_live_news,
        load_stored_prices,
        news_counts,
        price_coverage,
        query_news,
    )

warnings.filterwarnings("ignore")

# ============================================================
# CONFIGURATION  (same paths as Dashboard/app.py)
# ============================================================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

DATA_PATH = os.path.join(PROJECT_ROOT, "data", "final_dataset.csv")
NEWS_PATH = os.path.join(PROJECT_ROOT, "data", "sentiment_news.csv")
PRICE_HISTORY_PATH = os.path.join(PROJECT_ROOT, "data", "gold_prices_25y.csv")
GDELT_TONE_PATH = os.path.join(PROJECT_ROOT, "data", "gdelt_daily_macro_tone.csv")
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
def load_live_news():
    return load_persisted_live_news()


def live_news_updated_at():
    runs = latest_runs()
    timestamps = [
        run.get("completed_at") for name, run in runs.items()
        if name.startswith("news_") and run.get("status") == "success"
    ]
    return max(timestamps) if timestamps else None


def refresh_live_news_if_due(force=False):
    """Return durable headlines; the scheduled worker owns external fetches."""
    return load_live_news()


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


def load_price_history():
    """Load the full market-price history independently of the model dataset."""
    frames = []
    if os.path.exists(PRICE_HISTORY_PATH):
        frames.append(pd.read_csv(PRICE_HISTORY_PATH))
    stored = load_stored_prices()
    if not stored.empty:
        stored = stored.rename(columns={
            "open": "Open", "high": "High", "low": "Low",
            "close": "Close", "volume": "Volume",
        })
        frames.append(stored)
    if not frames:
        return pd.DataFrame()
    prices = pd.concat(frames, ignore_index=True, sort=False)
    if "date" not in prices.columns:
        raise ValueError("gold_prices_25y.csv has no 'date' column.")
    prices["date"] = pd.to_datetime(prices["date"], errors="coerce", utc=True).dt.tz_localize(None).dt.normalize()
    prices = prices.dropna(subset=["date"]).sort_values("date").drop_duplicates("date").reset_index(drop=True)
    for column in ("Close", "Open", "High", "Low", "Volume"):
        if column in prices.columns:
            prices[column] = pd.to_numeric(prices[column], errors="coerce")
    if "Close" not in prices.columns:
        raise ValueError("gold_prices_25y.csv has no 'Close' column.")
    prices["MA7"] = prices["Close"].rolling(7).mean()
    prices["MA20"] = prices["Close"].rolling(20).mean()
    return prices


def get_coverage_summary():
    prices = _state.get("price_history", pd.DataFrame())
    news = _state.get("news", pd.DataFrame())
    live = _state.get("live_news", pd.DataFrame())
    if prices.empty:
        prices = _state.get("df", pd.DataFrame())

    price_dates = set(prices["date"].dt.strftime("%Y-%m-%d")) if not prices.empty else set()
    price_info = {
        "source": "Yahoo Finance · GC=F COMEX futures" if os.path.exists(PRICE_HISTORY_PATH) else "Model dataset",
        "rows": int(len(prices)),
        "start": prices["date"].min().strftime("%Y-%m-%d") if not prices.empty else None,
        "end": prices["date"].max().strftime("%Y-%m-%d") if not prices.empty else None,
        "latest_close": clean(prices["Close"].iloc[-1]) if not prices.empty else None,
    }

    if os.path.exists(GDELT_TONE_PATH):
        tone = pd.read_csv(GDELT_TONE_PATH)
        tone["date"] = pd.to_datetime(tone["date"], errors="coerce", utc=True).dt.tz_localize(None).dt.normalize()
        tone = tone.dropna(subset=["date"])
        tone_dates = set(tone["date"].dt.strftime("%Y-%m-%d"))
        overlapping_days = len(price_dates & tone_dates)
        tone_range_days = prices[prices["date"].dt.strftime("%Y-%m-%d").isin(tone_dates)] if not prices.empty else pd.DataFrame()
        news_info = {
            "status": "imported",
            "source": "GDELT macro-news tone",
            "articles": int(pd.to_numeric(tone.get("article_count", 0), errors="coerce").fillna(0).sum()) if "article_count" in tone else 0,
            "days": int(tone["date"].dt.date.nunique()),
            "start": tone["date"].min().strftime("%Y-%m-%d") if not tone.empty else None,
            "end": tone["date"].max().strftime("%Y-%m-%d") if not tone.empty else None,
            "overlap_days": overlapping_days,
            "overlap_start": tone_range_days["date"].min().strftime("%Y-%m-%d") if not tone_range_days.empty else None,
            "overlap_end": tone_range_days["date"].max().strftime("%Y-%m-%d") if not tone_range_days.empty else None,
        }
    else:
        if not news.empty and "date" in news.columns:
            dates = news["date"].dropna()
            news_dates = set(dates.dt.strftime("%Y-%m-%d"))
            overlapping_days = len(price_dates & news_dates)
            news_info = {
                "status": "awaiting_export",
                "source": "Current FinBERT articles",
                "articles": int(len(news)),
                "days": int(dates.dt.date.nunique()),
                "start": dates.min().strftime("%Y-%m-%d") if not dates.empty else None,
                "end": dates.max().strftime("%Y-%m-%d") if not dates.empty else None,
                "overlap_days": overlapping_days,
                "overlap_start": None,
                "overlap_end": None,
            }
        else:
            news_info = {
                "status": "awaiting_export", "source": "No historical GDELT export",
                "articles": 0, "days": 0, "start": None, "end": None,
                "overlap_days": 0, "overlap_start": None, "overlap_end": None,
            }
    region_counts = news_counts()
    live_info = {
        "source": "Google News RSS · India + international",
        "count": int(len(live)),
        "national_count": int(region_counts.get("national", {}).get("count", 0)),
        "international_count": int(region_counts.get("international", {}).get("count", 0)),
        "start": live["date"].min().strftime("%Y-%m-%d") if not live.empty else None,
        "end": live["date"].max().strftime("%Y-%m-%d") if not live.empty else None,
        "updated_at": live_news_updated_at(),
    }
    run_status = latest_runs()
    pipeline_status = {
        name: {
            "status": run.get("status"),
            "completed_at": run.get("completed_at"),
            "records": int(run.get("records") or 0),
            "error": run.get("error"),
        }
        for name, run in run_status.items()
    }
    db_prices = price_coverage()
    if db_prices.get("rows"):
        price_info.update({
            "rows": int(db_prices["rows"]),
            "start": db_prices["start"],
            "end": db_prices["end"],
            "latest_close": clean(db_prices["latest_close"]),
        })
    model_data_end = _state.get("df", pd.DataFrame())["date"].max().strftime("%Y-%m-%d") if not _state.get("df", pd.DataFrame()).empty else None
    current_frame = current_model_frame()
    current_input_end = current_frame["date"].max().strftime("%Y-%m-%d") if not current_frame.empty else model_data_end
    return {
        "gold": price_info,
        "news": news_info,
        "live_news": live_info,
        "pipelines": pipeline_status,
        "storage": {"engine": "SQLite", "path": "data/gold_sentiment.sqlite3"},
        "model_data_end": model_data_end,
        "current_input_end": current_input_end,
        "model_inputs_current": bool(current_input_end and price_info["end"] == current_input_end),
        "historical_news_start": "2015-02-19",
    }


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


def current_model_frame():
    """Extend trained features to the latest stored gold session for inference."""
    prices = load_price_history()
    historical = _state.get("df", pd.DataFrame())
    if prices.empty or historical.empty:
        return historical.copy()

    sentiment_cols = [
        "sentiment_score", "article_count", "positive_count", "negative_count",
        "neutral_count", "avg_confidence",
    ]
    feature_cols = [c for c in [*sentiment_cols, *FRED_COLS] if c in historical.columns]
    features = historical[["date", *feature_cols]].copy()
    current = prices.merge(features, on="date", how="left")
    macro_cols = [c for c in FRED_COLS if c in current.columns]
    current[macro_cols] = current[macro_cols].ffill()
    present_sentiment = [c for c in sentiment_cols if c in current.columns]
    current[present_sentiment] = current[present_sentiment].fillna(0)
    current["MA7"] = current["Close"].rolling(7).mean()
    current["MA20"] = current["Close"].rolling(20).mean()
    current["volatility"] = current["Close"].rolling(7).std()
    current["momentum"] = current["Close"].pct_change(5) * 100
    return current[current["date"] >= historical["date"].min()].reset_index(drop=True)


def load_everything():
    init_database()
    _state["df"] = load_dataset()
    _state["news"] = load_news()
    _state["live_news"] = load_live_news()
    _state["price_history"] = load_price_history()
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

cors_origins = [
    origin.strip()
    for origin in os.environ.get(
        "GOLD_SENTIMENT_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _daily_pipeline_worker():
    """Refresh when the service starts on a new day, then every day at 06:00 IST."""
    try:
        await asyncio.to_thread(daily_refresh_due)
        while True:
            runs = latest_runs()
            expected = ("news_national", "news_international", "gold_prices")
            retry_needed = any(name not in runs or runs[name].get("status") != "success" for name in expected)
            if retry_needed:
                await asyncio.sleep(60 * 60)
            else:
                now = datetime.now(LOCAL_TZ)
                target = now.replace(hour=6, minute=0, second=0, microsecond=0)
                if target <= now:
                    target += timedelta(days=1)
                await asyncio.sleep(max(1, (target - now).total_seconds()))
            await asyncio.to_thread(daily_refresh_due)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        print(f"Daily data pipeline stopped unexpectedly: {type(exc).__name__}: {exc}")


@app.on_event("startup")
async def on_startup():
    try:
        init_database()
        load_everything()
    except Exception as e:
        # Fail loudly in the server logs but let the app boot, so
        # /docs still loads and the error is visible per-request.
        print("Failed to load project files:", e)
    app.state.daily_pipeline_task = asyncio.create_task(_daily_pipeline_worker())


@app.on_event("shutdown")
async def on_shutdown():
    task = getattr(app.state, "daily_pipeline_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


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
    refreshed_prices = load_price_history()
    if not refreshed_prices.empty:
        _state["price_history"] = refreshed_prices
    df = current_model_frame()
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
    market_history = _state.get("price_history", pd.DataFrame())
    latest_market = market_history.iloc[-1] if not market_history.empty else None

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
        "market_data_start": _state["price_history"]["date"].min().strftime("%Y-%m-%d") if not _state["price_history"].empty else df["date"].min().strftime("%Y-%m-%d"),
        "market_data_end": _state["price_history"]["date"].max().strftime("%Y-%m-%d") if not _state["price_history"].empty else df["date"].max().strftime("%Y-%m-%d"),
        "latest_market_price": clean(latest_market["Close"]) if latest_market is not None else None,
        "latest_market_date": latest_market["date"].strftime("%Y-%m-%d") if latest_market is not None else None,
        "seq_len": _state["seq_len"],
        "n_features": len(_state["feature_cols"]),
    }


# ------------------------------------------------------------
# /api/price
# ------------------------------------------------------------
@app.get("/api/price")
def get_price(period: str = Query("180", description="90, 180, 365, 1825, 25y, or all")):
    ensure_loaded()
    # The scheduled price updater appends to this CSV; reload it so the chart
    # reflects the newest stored market session without restarting the API.
    refreshed_prices = load_price_history()
    if not refreshed_prices.empty:
        _state["price_history"] = refreshed_prices
    df = _state.get("price_history", pd.DataFrame())
    if df.empty:
        df = _state["df"]

    if period == "90":
        plot_df = df.tail(90)
    elif period == "180":
        plot_df = df.tail(180)
    elif period == "365":
        plot_df = df.tail(365)
    elif period == "1825":
        plot_df = df.tail(1825)
    else:
        plot_df = df

    return {
        "dates": plot_df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "close": [clean(v) for v in plot_df["Close"]],
        "ma7": [clean(v) for v in plot_df.get("MA7", pd.Series(dtype=float))],
        "ma20": [clean(v) for v in plot_df.get("MA20", pd.Series(dtype=float))],
    }


@app.get("/api/data-coverage")
def get_data_coverage():
    ensure_loaded()
    _state["live_news"] = refresh_live_news_if_due()
    return get_coverage_summary()


@app.get("/api/news")
def get_news(
    region: str = Query("all", pattern="^(all|national|international)$"),
    day: str = Query("today", description="today, all, or YYYY-MM-DD"),
    limit: int = Query(100, ge=1, le=500),
):
    init_database()
    articles = query_news(region=region, day=day, limit=limit)
    records = []
    for _, row in articles.iterrows():
        records.append({key: clean(value) for key, value in row.to_dict().items()})
    return {
        "region": region,
        "day": day,
        "count": len(records),
        "updated_at": live_news_updated_at(),
        "articles": records,
    }


@app.get("/api/health")
def get_health():
    init_database()
    return {
        "status": "ok",
        "model_loaded": "df" in _state,
        "storage": "sqlite",
        "pipelines": latest_runs(),
    }


# ------------------------------------------------------------
# /api/sentiment
# ------------------------------------------------------------
@app.get("/api/sentiment")
def get_sentiment(
    days: int = Query(60, ge=1, le=1000),
    region: str = Query("all", pattern="^(all|national|international)$"),
):
    ensure_loaded()
    # Keep the FinBERT time series anchored to actually scored historical data.
    # Today's RSS headlines remain visible in the news list but are unscored.
    df = _state["df"]
    news = _state["news"].copy()
    live = query_news(region=region, day="today", limit=100)
    if not news.empty and "news_type" not in news.columns:
        news["news_type"] = "finbert_scored"
    if not live.empty:
        news = pd.concat([news, live], ignore_index=True, sort=False)
    if region != "all" and not news.empty and "region" in news.columns:
        news = news[news["region"] == region]
    if not news.empty and "date" in news.columns:
        news["date"] = pd.to_datetime(news["date"], errors="coerce", utc=True).dt.tz_localize(None).dt.normalize()
        news = news.dropna(subset=["date"])
        if "url" in news.columns:
            has_url = news["url"].fillna("").astype(str).str.strip().ne("")
            news = pd.concat(
                [news.loc[has_url].drop_duplicates("url", keep="first"), news.loc[~has_url]],
                ignore_index=True,
            )

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
        possible_cols = ["date", "published_at", "title", "source", "sentiment", "confidence", "url", "news_type", "region"]
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
        "live_news_count": int(len(live)),
        "live_news_updated_at": live_news_updated_at(),
        "news_region": region,
    }


# ------------------------------------------------------------
# /api/macro
# ------------------------------------------------------------
@app.get("/api/macro")
def get_macro():
    ensure_loaded()
    df = current_model_frame()
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

    latest_signal = None
    current_frame = current_model_frame()
    if not current_frame.empty:
        try:
            direction, confidence, probability_up, _ = make_next_prediction(
                current_frame, _state["model"], _state["feature_cols"],
                _state["seq_len"], _state["threshold"], _state["scaler"],
            )
            latest = current_frame.iloc[-1]
            latest_signal = {
                "input_date": latest["date"].strftime("%Y-%m-%d"),
                "price": clean(latest["Close"]),
                "direction": direction,
                "confidence": clean(confidence),
                "probability_up": clean(probability_up),
                "scored_news_through": _state["df"]["date"].max().strftime("%Y-%m-%d"),
            }
        except Exception:
            latest_signal = None

    return {
        "test_accuracy": metric("test_accuracy"),
        "balanced_accuracy": metric("test_balanced_accuracy"),
        "macro_f1": metric("test_macro_f1"),
        "roc_auc": metric("roc_auc"),
        "validation_macro_f1": metric("validation_macro_f1"),
        "predictions": predictions,
        "correct": correct,
        "total": total,
        "latest_signal": latest_signal,
        "evaluation_data_end": test_predictions["date"].max().strftime("%Y-%m-%d") if not test_predictions.empty else None,
    }


# ------------------------------------------------------------
# /api/about
# ------------------------------------------------------------
@app.get("/api/about")
def get_about():
    ensure_loaded()
    current_frame = current_model_frame()
    return {
        "seq_len": _state["seq_len"],
        "n_features": len(_state["feature_cols"]),
        "hidden_size": 64,
        "lstm_layers": 2,
        "dropout": "0.20 / 0.25",
        "threshold": clean(_state["threshold"]),
        "data_start": current_frame["date"].min().strftime("%Y-%m-%d") if not current_frame.empty else None,
        "data_end": current_frame["date"].max().strftime("%Y-%m-%d") if not current_frame.empty else None,
        "training_data_end": _state["df"]["date"].max().strftime("%Y-%m-%d"),
    }


# In a single-container deployment, FastAPI also serves the built React app.
# Local Vite development continues to use its own dev server and /api proxy.
FRONTEND_DIST = Path(PROJECT_ROOT) / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    @app.get("/")
    def serve_frontend_index():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{frontend_path:path}")
    def serve_frontend_route(frontend_path: str):
        if frontend_path == "api" or frontend_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        root = FRONTEND_DIST.resolve()
        requested = (root / frontend_path).resolve()
        if not requested.is_relative_to(root):
            raise HTTPException(status_code=404, detail="Not found")
        if requested.is_file():
            return FileResponse(requested)
        if Path(frontend_path).suffix:
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(root / "index.html")
