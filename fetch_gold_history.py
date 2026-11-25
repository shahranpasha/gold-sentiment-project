"""Download 25 years of daily COMEX gold futures (GC=F) from Yahoo Finance."""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf


PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_FILE = DATA_DIR / "gold_prices_25y.csv"


def years_ago(day: date, years: int) -> date:
    try:
        return day.replace(year=day.year - years)
    except ValueError:  # Feb 29 -> Feb 28 in a non-leap year
        return day.replace(year=day.year - years, day=28)


def download_history(start: date, end: date) -> pd.DataFrame:
    # Yahoo's end parameter is exclusive, so include the requested final day.
    history = yf.Ticker("GC=F").history(
        start=start.isoformat(),
        end=(end + timedelta(days=1)).isoformat(),
        interval="1d",
        auto_adjust=False,
        actions=False,
    )
    if history.empty:
        raise RuntimeError("Yahoo Finance returned no GC=F history.")

    history = history.reset_index()
    date_col = "Date" if "Date" in history.columns else "Datetime"
    if date_col not in history.columns:
        raise RuntimeError(f"Unexpected Yahoo Finance columns: {list(history.columns)}")

    history["date"] = pd.to_datetime(history[date_col], errors="coerce", utc=True).dt.tz_convert(None).dt.normalize()
    history = history.dropna(subset=["date"])
    history = history[(history["date"].dt.date >= start) & (history["date"].dt.date <= end)]
    columns = [column for column in ("Open", "High", "Low", "Close", "Volume") if column in history.columns]
    if "Close" not in columns:
        raise RuntimeError(f"Yahoo Finance history has no Close column: {list(history.columns)}")
    result = history[["date", *columns]].copy()
    for column in columns:
        result[column] = pd.to_numeric(result[column], errors="coerce")
    return result.dropna(subset=["Close"]).drop_duplicates("date").sort_values("date").reset_index(drop=True)


def main() -> None:
    end = date.today()
    start = years_ago(end, 25)
    print(f"Downloading daily COMEX gold futures GC=F from {start} through {end}...")
    print("Source: Yahoo Finance via yfinance. This keeps the project's existing futures series.")
    prices = download_history(start, end)
    first_returned = prices["date"].min().date()
    if first_returned > start + timedelta(days=30):
        raise RuntimeError(
            f"Yahoo history starts at {first_returned}, later than the requested "
            f"25-year start {start}; refusing to save a partial history."
        )

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    prices.to_csv(OUTPUT_FILE, index=False, date_format="%Y-%m-%d")
    print(f"Saved {len(prices)} daily bars to {OUTPUT_FILE}")
    print(f"Returned date range: {prices['date'].min().date()} through {prices['date'].max().date()}")


if __name__ == "__main__":
    main()
