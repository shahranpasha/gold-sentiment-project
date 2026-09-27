import pandas as pd
import numpy as np
from pathlib import Path


# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

NEWS_FILE = BASE_DIR / "data" / "sentiment_news.csv"
PRICE_FILE = BASE_DIR / "data" / "gold_prices_clean.csv"
FRED_FILE = BASE_DIR / "data" / "fred_data.csv"

OUTPUT_FILE = BASE_DIR / "data" / "final_dataset.csv"


# ==========================================================
# STEP 1 — LOAD DATASETS
# ==========================================================

print("=" * 60)
print("LOADING DATASETS")
print("=" * 60)

news = pd.read_csv(NEWS_FILE)
prices = pd.read_csv(PRICE_FILE)
fred = pd.read_csv(FRED_FILE)


print("\nNews rows:", len(news))
print("Price rows:", len(prices))
print("FRED rows:", len(fred))


print("\nNews columns:")
print(news.columns.tolist())

print("\nPrice columns:")
print(prices.columns.tolist())

print("\nFRED columns:")
print(fred.columns.tolist())


# ==========================================================
# STEP 2 — VALIDATE REQUIRED COLUMNS
# ==========================================================

if "date" not in news.columns:
    raise ValueError(
        "ERROR: sentiment_news.csv must contain a 'date' column."
    )

if "sentiment" not in news.columns:
    raise ValueError(
        "ERROR: sentiment_news.csv must contain a 'sentiment' column."
    )

if "date" not in prices.columns:

    if "Date" in prices.columns:
        prices.rename(
            columns={"Date": "date"},
            inplace=True
        )

    else:
        raise ValueError(
            "ERROR: gold_prices_clean.csv must contain "
            "'date' or 'Date' column."
        )


if "date" not in fred.columns:

    if "Date" in fred.columns:
        fred.rename(
            columns={"Date": "date"},
            inplace=True
        )

    else:
        raise ValueError(
            "ERROR: fred_data.csv must contain "
            "'date' or 'Date' column."
        )


# ==========================================================
# STEP 3 — STANDARDIZE DATES
# ==========================================================

print("\nStandardizing dates...")


# ---------- NEWS DATE ----------

news["date"] = pd.to_datetime(
    news["date"],
    utc=True,
    errors="coerce"
)

news["date"] = news["date"].dt.tz_localize(None)
news["date"] = news["date"].dt.normalize()


# ---------- PRICE DATE ----------

prices["date"] = pd.to_datetime(
    prices["date"],
    utc=True,
    errors="coerce"
)

prices["date"] = prices["date"].dt.tz_localize(None)
prices["date"] = prices["date"].dt.normalize()


# ---------- FRED DATE ----------

fred["date"] = pd.to_datetime(
    fred["date"],
    errors="coerce"
)

fred["date"] = fred["date"].dt.normalize()


# Remove invalid dates

news.dropna(subset=["date"], inplace=True)
prices.dropna(subset=["date"], inplace=True)
fred.dropna(subset=["date"], inplace=True)


print("News date range:")
print(news["date"].min(), "to", news["date"].max())

print("\nPrice date range:")
print(prices["date"].min(), "to", prices["date"].max())

print("\nFRED date range:")
print(fred["date"].min(), "to", fred["date"].max())


# ==========================================================
# STEP 4 — ENSURE CONFIDENCE EXISTS
# ==========================================================

if "confidence" not in news.columns:

    print("\nConfidence column not found.")
    print("Creating default confidence values...")

    news["confidence"] = 1.0


# ==========================================================
# STEP 5 — CONVERT FINBERT SENTIMENT TO NUMERICAL SCORE
# ==========================================================

print("\nConverting sentiment to numerical scores...")


def sentiment_to_score(sentiment):

    sentiment = str(sentiment).lower().strip()

    if sentiment == "positive":
        return 1

    elif sentiment == "negative":
        return -1

    else:
        return 0


news["sentiment_score"] = news[
    "sentiment"
].apply(sentiment_to_score)


# ==========================================================
# STEP 6 — AGGREGATE DAILY FINBERT SENTIMENT
# ==========================================================

print("\nAggregating daily sentiment...")


daily_sentiment = (

    news.groupby("date")

    .agg(

        sentiment_score=(
            "sentiment_score",
            "mean"
        ),

        article_count=(
            "sentiment_score",
            "count"
        ),

        positive_count=(
            "sentiment",
            lambda x: (
                x.astype(str).str.lower()
                == "positive"
            ).sum()
        ),

        negative_count=(
            "sentiment",
            lambda x: (
                x.astype(str).str.lower()
                == "negative"
            ).sum()
        ),

        neutral_count=(
            "sentiment",
            lambda x: (
                x.astype(str).str.lower()
                == "neutral"
            ).sum()
        ),

        avg_confidence=(
            "confidence",
            "mean"
        )

    )

    .reset_index()

)


print("\nDaily sentiment sample:")

print(
    daily_sentiment.head()
)


# ==========================================================
# STEP 7 — PREPARE FRED DATA
# ==========================================================

print("\nPreparing FRED macroeconomic data...")


fred = fred.sort_values(
    "date"
).drop_duplicates(
    subset=["date"]
)


# Convert all FRED columns to numeric

fred_columns = [
    col for col in fred.columns
    if col != "date"
]


for col in fred_columns:

    fred[col] = pd.to_numeric(
        fred[col],
        errors="coerce"
    )


print("\nFRED indicators:")

print(fred_columns)


# ==========================================================
# STEP 8 — MERGE GOLD PRICES + FINBERT SENTIMENT
# ==========================================================

print("\nMerging gold prices with FinBERT sentiment...")


merged = pd.merge(

    prices,

    daily_sentiment,

    on="date",

    how="left"

)


# Fill missing sentiment values

sentiment_columns = [

    "sentiment_score",

    "article_count",

    "positive_count",

    "negative_count",

    "neutral_count",

    "avg_confidence"

]


merged[sentiment_columns] = merged[
    sentiment_columns
].fillna(0)


# ==========================================================
# STEP 9 — MERGE FRED DATA
# ==========================================================

print("\nMerging FRED macroeconomic indicators...")


# Sort data before merge_asof

merged = merged.sort_values("date")
fred = fred.sort_values("date")


# Use most recently available FRED value
# This is important because FRED data is monthly,
# quarterly, or daily depending on the indicator.

merged = pd.merge_asof(

    merged,

    fred,

    on="date",

    direction="backward"

)


# Forward-fill remaining macro values

if len(fred_columns) > 0:

    merged[fred_columns] = merged[
        fred_columns
    ].ffill()


print("FRED data merged successfully.")


# ==========================================================
# STEP 10 — ADD TECHNICAL INDICATORS
# ==========================================================

print("\nAdding technical indicators...")


merged = merged.sort_values(
    "date"
).reset_index(
    drop=True
)


# Moving averages

merged["MA7"] = (

    merged["Close"]

    .rolling(
        window=7
    )

    .mean()

)


merged["MA20"] = (

    merged["Close"]

    .rolling(
        window=20
    )

    .mean()

)


# 7-day volatility

merged["volatility"] = (

    merged["Close"]

    .rolling(
        window=7
    )

    .std()

)


# 5-day momentum

merged["momentum"] = (

    merged["Close"]

    .pct_change(
        periods=5
    )

    * 100

)


# ==========================================================
# STEP 11 — CREATE LSTM TARGET VARIABLE
# ==========================================================

print("\nCreating prediction target...")


# Predict whether NEXT DAY'S closing price
# will be higher than today's closing price.

merged["direction"] = np.where(

    merged["Close"].shift(-1)

    > merged["Close"],

    1,

    0

)


# Last row has no future price
# Therefore remove it before training.

merged.iloc[-1, merged.columns.get_loc(
    "direction"
)] = np.nan


# ==========================================================
# STEP 12 — REMOVE INVALID ROWS
# ==========================================================

print("\nRemoving incomplete rows...")


rows_before = len(merged)


merged = merged.dropna().reset_index(
    drop=True
)


rows_after = len(merged)


print(
    f"Rows before cleaning: {rows_before}"
)

print(
    f"Rows after cleaning:  {rows_after}"
)


# ==========================================================
# STEP 13 — SAVE FINAL DATASET
# ==========================================================

merged.to_csv(

    OUTPUT_FILE,

    index=False

)


# ==========================================================
# FINAL SUMMARY
# ==========================================================

print("\n")
print("=" * 60)
print("FINAL DATASET CREATED SUCCESSFULLY")
print("=" * 60)


print(
    f"\nFinal rows: {len(merged)}"
)


print(
    f"Final columns: {len(merged.columns)}"
)


print("\nFinal Dataset Columns:")

print(
    merged.columns.tolist()
)


print(
    f"\nDays with news: "
    f"{int((merged['article_count'] > 0).sum())}"
)


print(
    f"Days without news: "
    f"{int((merged['article_count'] == 0).sum())}"
)


print(
    f"\nAverage sentiment score: "
    f"{merged['sentiment_score'].mean():.4f}"
)


print("\nFRED Indicators Included:")

print(
    fred_columns
)


print("\nSample of final dataset:")


sample_columns = [

    "date",

    "Close",

    "direction",

    "sentiment_score",

    "article_count",

    "MA7",

    "MA20",

    "Federal_Funds_Rate",

    "CPI",

    "Unemployment",

    "GDP",

    "PCE",

    "Treasury10Y"

]


# Only display columns that actually exist

sample_columns = [

    col for col in sample_columns

    if col in merged.columns

]


print(

    merged[
        sample_columns
    ]

    .head(10)

)


print("\nSaved successfully to:")

print(
    OUTPUT_FILE
)


print("\nPIPELINE COMPLETE")

print(
    "Gold Prices + FinBERT Sentiment + "
    "FRED Macroeconomic Data + "
    "Technical Indicators are ready for the LSTM."
)