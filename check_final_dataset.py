import pandas as pd
import numpy as np

print("=" * 70)
print(" GOLD SENTIMENT PROJECT - FINAL DATASET DIAGNOSTIC")
print("=" * 70)

FILE = "data/final_dataset.csv"

# ==========================================================
# 1. LOAD DATA
# ==========================================================

print("\n[1] Loading final dataset...")

df = pd.read_csv(FILE)

print("File loaded successfully.")
print("Rows    :", len(df))
print("Columns :", len(df.columns))

# ==========================================================
# 2. DISPLAY COLUMNS
# ==========================================================

print("\n[2] Dataset columns:")

for i, column in enumerate(df.columns, start=1):
    print(f"{i:02d}. {column}")

# ==========================================================
# 3. DATE INFORMATION
# ==========================================================

print("\n[3] Date information...")

if "date" in df.columns:

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    print("Start date :", df["date"].min())
    print("End date   :", df["date"].max())

    print(
        "Invalid dates:",
        df["date"].isna().sum()
    )

else:

    print("WARNING: 'date' column not found.")

# ==========================================================
# 4. MISSING VALUES
# ==========================================================

print("\n[4] Missing values:")

missing = df.isna().sum()

missing_found = False

for column, count in missing.items():

    if count > 0:

        print(
            f"{column:<25} : {count}"
        )

        missing_found = True

if not missing_found:

    print("No missing values found.")

# ==========================================================
# 5. NUMERIC SUMMARY
# ==========================================================

print("\n[5] Numeric data summary:")

numeric_columns = df.select_dtypes(
    include=np.number
).columns

print(
    df[numeric_columns].describe().round(4).to_string()
)

# ==========================================================
# 6. SENTIMENT INFORMATION
# ==========================================================

print("\n[6] FINBERT SENTIMENT INFORMATION")

sentiment_columns = [
    "sentiment_score",
    "article_count",
    "positive_count",
    "negative_count",
    "neutral_count",
    "avg_confidence"
]

for column in sentiment_columns:

    if column in df.columns:

        print(
            f"\n{column}:"
        )

        print(
            "  Min  :",
            df[column].min()
        )

        print(
            "  Max  :",
            df[column].max()
        )

        print(
            "  Mean :",
            round(df[column].mean(), 4)
        )

# ==========================================================
# 7. FRED INFORMATION
# ==========================================================

print("\n[7] FRED ECONOMIC FEATURES")

fred_columns = [
    "Federal_Funds_Rate",
    "CPI",
    "Unemployment",
    "GDP",
    "PCE",
    "Treasury10Y"
]

for column in fred_columns:

    if column in df.columns:

        print(
            f"\n{column}:"
        )

        print(
            "  Min  :",
            df[column].min()
        )

        print(
            "  Max  :",
            df[column].max()
        )

        print(
            "  Mean :",
            round(df[column].mean(), 4)
        )

        print(
            "  Missing:",
            df[column].isna().sum()
        )

    else:

        print(
            f"{column}: NOT FOUND"
        )

# ==========================================================
# 8. TARGET / DIRECTION
# ==========================================================

print("\n[8] TARGET VARIABLE")

if "direction" in df.columns:

    print(
        "\nDirection distribution:"
    )

    counts = df["direction"].value_counts()

    print(counts)

    print("\nPercentages:")

    percentages = (
        df["direction"]
        .value_counts(normalize=True)
        * 100
    )

    for value, percentage in percentages.items():

        if value == 1:
            label = "UP"
        else:
            label = "DOWN"

        print(
            f"{label:<6}: {percentage:.2f}%"
        )

else:

    print(
        "ERROR: direction column not found."
    )

# ==========================================================
# 9. PRICE INFORMATION
# ==========================================================

print("\n[9] GOLD PRICE INFORMATION")

price_columns = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume"
]

for column in price_columns:

    if column in df.columns:

        print(
            f"{column:<10}: "
            f"Min={df[column].min():.4f}, "
            f"Max={df[column].max():.4f}, "
            f"Mean={df[column].mean():.4f}"
        )

# ==========================================================
# 10. CHECK DATE ORDER
# ==========================================================

print("\n[10] Checking chronological order...")

if "date" in df.columns:

    is_sorted = df["date"].is_monotonic_increasing

    print(
        "Chronological order:",
        is_sorted
    )

    if not is_sorted:

        print(
            "WARNING: Dataset is NOT sorted chronologically."
        )

# ==========================================================
# 11. DUPLICATE DATES
# ==========================================================

print("\n[11] Duplicate date check...")

if "date" in df.columns:

    duplicate_dates = df["date"].duplicated().sum()

    print(
        "Duplicate dates:",
        duplicate_dates
    )

# ==========================================================
# 12. LAST 10 ROWS
# ==========================================================

print("\n[12] Last 10 rows:")

display_columns = [
    "date",
    "Close",
    "sentiment_score",
    "article_count",
    "MA7",
    "MA20",
    "volatility",
    "momentum",
    "direction"
]

available_columns = [
    column
    for column in display_columns
    if column in df.columns
]

print(
    df[available_columns]
    .tail(10)
    .to_string(index=False)
)

# ==========================================================
# FINAL SUMMARY
# ==========================================================

print("\n" + "=" * 70)
print(" DIAGNOSTIC COMPLETE")
print("=" * 70)

print("\nDataset:")
print("Rows   :", len(df))
print("Columns:", len(df.columns))

if "direction" in df.columns:

    down = (df["direction"] == 0).sum()
    up = (df["direction"] == 1).sum()

    print("\nTarget:")
    print("DOWN :", down)
    print("UP   :", up)

if "sentiment_score" in df.columns:

    print(
        "\nAverage sentiment:",
        round(
            df["sentiment_score"].mean(),
            4
        )
    )

print("\nSend me the COMPLETE output of this program.")
print("=" * 70)