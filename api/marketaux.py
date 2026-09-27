import os
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

# =====================================================
# Locate project root and load .env
# =====================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

print("Project Root :", PROJECT_ROOT)
print(".env Found   :", ENV_FILE.exists())



API_KEY = "c3awwR5rZgfdA0rHnwWIoaWUqo6kN2M2t2sv8jbf"

if not API_KEY:
    raise ValueError(
        "MARKETAUX_API_KEY not found.\n"
        "Check your .env file."
    )

print("API Key Loaded Successfully")

# =====================================================
# API Endpoint
# =====================================================

URL = "https://api.marketaux.com/v1/news/all"

params = {
    "api_token": API_KEY,
    "language": "en",
    "limit": 3,
    "filter_entities": "true",
    "symbols": "Gold, Federal Reserve, FOMC"
}

print("\nDownloading news...")

response = requests.get(URL, params=params, timeout=30)

print("Status Code:", response.status_code)

if response.status_code != 200:
    print("\nServer Response:")
    print(response.text)
    raise SystemExit()

json_data = response.json()

import json
print(json.dumps(json_data, indent=4))

articles = json_data.get("data", [])

print(f"Articles Downloaded: {len(articles)}")

rows = []

for article in articles:

    rows.append({
        "date": article.get("published_at"),
        "source": article.get("source"),
        "title": article.get("title"),
        "description": article.get("description"),
        "text": article.get("snippet"),
        "url": article.get("url"),
    })

df = pd.DataFrame(rows)

DATA_FOLDER = PROJECT_ROOT / "data"
DATA_FOLDER.mkdir(exist_ok=True)

OUTPUT_FILE = DATA_FOLDER / "raw_news.csv"

df.to_csv(OUTPUT_FILE, index=False)

print("\n================================")
print("DOWNLOAD COMPLETE")
print("================================")
print("Saved to:", OUTPUT_FILE)
print(df.head())