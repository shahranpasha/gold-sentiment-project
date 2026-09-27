import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fredapi import Fred

# =====================================
# Load .env
# =====================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

API_KEY = os.getenv("FRED_API_KEY")

if API_KEY is None:
    raise ValueError("FRED_API_KEY not found in .env")

print("✓ FRED API Key Loaded")

fred = Fred(api_key=API_KEY)

# =====================================
# Download indicators
# =====================================

series = {
    "Federal_Funds_Rate": "FEDFUNDS",
    "CPI": "CPIAUCSL",
    "Unemployment": "UNRATE",
    "GDP": "GDP",
    "PCE": "PCE",
    "Treasury10Y": "DGS10"
}

df = pd.DataFrame()

for name, code in series.items():

    print(f"Downloading {name}...")

    data = fred.get_series(code)

    df[name] = data

df.index.name = "date"

df.reset_index(inplace=True)

# =====================================
# Save
# =====================================

output = PROJECT_ROOT / "data" / "fred_data.csv"

df.to_csv(output, index=False)

print("\nSaved Successfully!")

print(output)

print(df.head())