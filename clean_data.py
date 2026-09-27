import pandas as pd
from pathlib import Path


# ==========================================================
# PROJECT PATHS
# ==========================================================

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"

MARKETAUX_FILE = DATA_DIR / "raw_news.csv"
NEWSAPI_FILE = PROJECT_ROOT / "gold_news.csv"

CLEAN_NEWS_FILE = DATA_DIR / "gold_news_clean.csv"
CLEAN_PRICES_FILE = DATA_DIR / "gold_prices_clean.csv"
PRICE_FILE = DATA_DIR / "gold_prices.csv"


# ==========================================================
# PART 1 — LOAD AND COMBINE NEWS DATA
# ==========================================================

print("=" * 55)
print("PART 1 — LOADING NEWS DATA")
print("=" * 55)


news_frames = []


# ----------------------------------------------------------
# Load Marketaux data
# ----------------------------------------------------------

if MARKETAUX_FILE.exists():
    print(f"\nLoading Marketaux data:")
    print(MARKETAUX_FILE)

    marketaux = pd.read_csv(MARKETAUX_FILE)

    print(f"Marketaux articles found: {len(marketaux)}")
    print("Marketaux columns:")
    print(list(marketaux.columns))

    news_frames.append(marketaux)

else:
    print("\nWARNING: Marketaux file not found:")
    print(MARKETAUX_FILE)


# ----------------------------------------------------------
# Load NewsAPI data
# ----------------------------------------------------------

if NEWSAPI_FILE.exists():
    print(f"\nLoading NewsAPI data:")
    print(NEWSAPI_FILE)

    newsapi = pd.read_csv(NEWSAPI_FILE)

    print(f"NewsAPI articles found: {len(newsapi)}")
    print("NewsAPI columns:")
    print(list(newsapi.columns))

    news_frames.append(newsapi)

else:
    print("\nWARNING: NewsAPI file not found:")
    print(NEWSAPI_FILE)


# Stop if no news files were found
if not news_frames:
    raise FileNotFoundError(
        "\nNo news files were found.\n"
        f"Expected Marketaux file: {MARKETAUX_FILE}\n"
        f"Expected NewsAPI file: {NEWSAPI_FILE}"
    )


# ==========================================================
# STANDARDIZE NEWS COLUMNS
# ==========================================================

print("\nStandardizing news columns...")


def standardize_news_columns(df):

    df = df.copy()

    # Convert possible date column names to "date"
    date_columns = [
        "date",
        "published_at",
        "publishedAt",
        "published_date"
    ]

    for column in date_columns:
        if column in df.columns:
            if column != "date":
                df.rename(columns={column: "date"}, inplace=True)
            break


    # Standardize source column
    if "source" in df.columns:

        # NewsAPI sometimes stores source as text already
        df["source"] = df["source"].astype(str)

    else:
        df["source"] = "Unknown"


    # Ensure title exists
    if "title" not in df.columns:
        df["title"] = ""


    # Standardize description
    description_columns = [
        "description",
        "content",
        "snippet"
    ]

    found_description = False

    for column in description_columns:

        if column in df.columns:

            if column != "description":
                df.rename(
                    columns={column: "description"},
                    inplace=True
                )

            found_description = True
            break


    if not found_description:
        df["description"] = ""


    # Ensure URL exists
    if "url" not in df.columns:
        df["url"] = ""


    # Keep only required columns
    required_columns = [
        "date",
        "source",
        "title",
        "description",
        "url"
    ]


    # Add missing columns if necessary
    for column in required_columns:

        if column not in df.columns:
            df[column] = ""


    return df[required_columns]


# Standardize every API dataset
standardized_frames = []

for frame in news_frames:

    cleaned_frame = standardize_news_columns(frame)

    standardized_frames.append(cleaned_frame)


# Combine Marketaux + NewsAPI
news = pd.concat(
    standardized_frames,
    ignore_index=True
)


print(f"\nTotal articles before combining cleanup: {len(news)}")


# ==========================================================
# CLEAN NEWS DATA
# ==========================================================

print("\nCleaning news data...")


# Convert important columns to strings
news["title"] = news["title"].fillna("").astype(str)
news["description"] = news["description"].fillna("").astype(str)
news["source"] = news["source"].fillna("Unknown").astype(str)
news["url"] = news["url"].fillna("").astype(str)


# Remove rows with empty titles
news = news[
    news["title"].str.strip() != ""
]


# Convert date safely
news["date"] = pd.to_datetime(
    news["date"],
    errors="coerce",
    utc=True
)


# Remove invalid dates
news.dropna(
    subset=["date"],
    inplace=True
)


# Remove timezone information
news["date"] = news["date"].dt.tz_localize(None)


# ==========================================================
# REMOVE DUPLICATES
# ==========================================================

before_duplicates = len(news)

# First remove duplicates using URL
news.drop_duplicates(
    subset=["url"],
    keep="first",
    inplace=True
)

# Then remove duplicate titles
news.drop_duplicates(
    subset=["title"],
    keep="first",
    inplace=True
)

after_duplicates = len(news)

print(
    f"Duplicates removed: "
    f"{before_duplicates - after_duplicates}"
)


# ==========================================================
# GOLD-RELATED NEWS FILTER
# ==========================================================

print("\nFiltering gold-related news...")


gold_keywords = [
    "gold",
    "xau",
    "xauusd",
    "bullion",
    "precious metal",
    "gold price",
    "gold market",
    "gold futures"
]


supporting_keywords = [
    "price",
    "market",
    "investment",
    "invest",
    "commodity",
    "fed",
    "federal reserve",
    "fomc",
    "interest rate",
    "interest rates",
    "dollar",
    "safe haven",
    "treasury",
    "yield",
    "inflation",
    "cpi",
    "rally",
    "ounce",
    "futures",
    "central bank",
    "rate cut"
]


def is_gold_related(row):

    text = (
        str(row["title"]).lower()
        + " "
        + str(row["description"]).lower()
    )

    has_gold_keyword = any(
        keyword in text
        for keyword in gold_keywords
    )

    has_supporting_keyword = any(
        keyword in text
        for keyword in supporting_keywords
    )

    return has_gold_keyword and has_supporting_keyword


before_filter = len(news)

news = news[
    news.apply(
        is_gold_related,
        axis=1
    )
]

after_filter = len(news)

print(
    f"Articles before relevance filter: {before_filter}"
)

print(
    f"Articles after relevance filter:  {after_filter}"
)


# ==========================================================
# CREATE TEXT COLUMN FOR FINBERT
# ==========================================================

news["text"] = (
    news["title"].str.strip()
    + ". "
    + news["description"].str.strip()
)


# Remove rows where resulting text is effectively empty
news = news[
    news["text"].str.strip() != "."
]


# Sort oldest to newest
news.sort_values(
    "date",
    ascending=True,
    inplace=True
)


# Reset index
news.reset_index(
    drop=True,
    inplace=True
)


# Keep final columns
news = news[
    [
        "date",
        "source",
        "title",
        "description",
        "text",
        "url"
    ]
]


# ==========================================================
# SAVE CLEAN NEWS
# ==========================================================

DATA_DIR.mkdir(
    exist_ok=True
)

news.to_csv(
    CLEAN_NEWS_FILE,
    index=False
)


print("\n" + "=" * 55)
print("NEWS CLEANING COMPLETE")
print("=" * 55)

print(f"Final news articles: {len(news)}")

print("\nSaved to:")
print(CLEAN_NEWS_FILE)

print("\nSample:")

if len(news) > 0:
    print(
        news[
            [
                "date",
                "source",
                "title"
            ]
        ]
        .head(5)
        .to_string()
    )

else:
    print("No articles remain after filtering.")


# ==========================================================
# PART 2 — CLEAN GOLD PRICE DATA
# ==========================================================

print("\n" + "=" * 55)
print("PART 2 — CLEANING GOLD PRICE DATA")
print("=" * 55)


if not PRICE_FILE.exists():

    raise FileNotFoundError(
        f"\nGold price file not found:\n{PRICE_FILE}"
    )


prices = pd.read_csv(
    PRICE_FILE
)


print(f"\nPrice rows before cleaning: {len(prices)}")

print("Price columns:")
print(list(prices.columns))


# ----------------------------------------------------------
# Standardize date column
# ----------------------------------------------------------

if "Date" in prices.columns:

    prices.rename(
        columns={"Date": "date"},
        inplace=True
    )

elif "date" not in prices.columns:

    raise KeyError(
        "No Date or date column found in gold_prices.csv"
    )


# ----------------------------------------------------------
# Convert dates safely
# ----------------------------------------------------------

prices["date"] = pd.to_datetime(
    prices["date"],
    errors="coerce",
    utc=True
)


# Remove invalid dates
prices.dropna(
    subset=["date"],
    inplace=True
)


# Remove timezone
prices["date"] = prices["date"].dt.tz_localize(None)


# ----------------------------------------------------------
# Convert numerical columns
# ----------------------------------------------------------

numeric_columns = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume"
]


for column in numeric_columns:

    if column in prices.columns:

        prices[column] = pd.to_numeric(
            prices[column],
            errors="coerce"
        )


# Remove rows with missing values
prices.dropna(
    subset=["Close"],
    inplace=True
)


# IMPORTANT:
# Sort oldest to newest BEFORE calculating returns
prices.sort_values(
    "date",
    ascending=True,
    inplace=True
)


prices.reset_index(
    drop=True,
    inplace=True
)


# ==========================================================
# ADD DAILY RETURN
# ==========================================================

prices["daily_return"] = (
    prices["Close"]
    .pct_change()
    * 100
)


# ==========================================================
# ADD DIRECTION
# ==========================================================

prices["direction"] = (
    prices["daily_return"] > 0
).astype(int)


# First row has no previous day
prices.loc[
    0,
    "daily_return"
] = 0


prices.loc[
    0,
    "direction"
] = 0


# ==========================================================
# SAVE CLEAN PRICES
# ==========================================================

prices.to_csv(
    CLEAN_PRICES_FILE,
    index=False
)


print("\n" + "=" * 55)
print("PRICE CLEANING COMPLETE")
print("=" * 55)

print(f"Final price rows: {len(prices)}")

print("\nSaved to:")
print(CLEAN_PRICES_FILE)

print("\nSample:")

print(
    prices[
        [
            "date",
            "Close",
            "daily_return",
            "direction"
        ]
    ]
    .tail(5)
    .to_string()
)


# ==========================================================
# FINAL SUMMARY
# ==========================================================

print("\n" + "=" * 55)
print("COMPLETE CLEANING SUMMARY")
print("=" * 55)

print(f"Final news articles: {len(news)}")
print(f"Final price days:    {len(prices)}")

print("\nNews output:")
print(CLEAN_NEWS_FILE)

print("\nPrice output:")
print(CLEAN_PRICES_FILE)

print("\nCleaning completed successfully.")