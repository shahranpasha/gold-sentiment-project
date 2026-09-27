import os
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

# ===========================================
# Load .env
# ===========================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

API_KEY = "TQ598WJF0FXWQXOZ"

if not API_KEY:
    raise ValueError("ALPHAVANTAGE_API_KEY not found in .env")

print("✓ Alpha Vantage API Key Loaded")

# ===========================================
# Download Gold Spot Price
# ===========================================

URL = "https://www.alphavantage.co/query"

params = {
    "function": "GOLD_SILVER_SPOT",
    "symbol": "GOLD",
    "apikey": API_KEY
}

print("Downloading live gold price...")

response = requests.get(URL, params=params, timeout=30)

print("HTTP Status:", response.status_code)

response.raise_for_status()

data = response.json()

# Save raw JSON for debugging if needed
print(data)

# ===========================================
# Convert to DataFrame
# ===========================================

price = pd.DataFrame([data])

output = PROJECT_ROOT / "data" / "live_gold_price.csv"

price.to_csv(output, index=False)

print("\nSaved Successfully!")

print(output)
