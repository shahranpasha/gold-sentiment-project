"""Normalize a GDELT GKG daily macro-tone query export for model training.

The GDELT export contains calculated article tone metadata, not article text or
FinBERT predictions. See queries/gdelt_macro_tone.sql for the matching query.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
INPUT_FILE = DATA_DIR / "gdelt_macro_tone_export.csv"
OUTPUT_FILE = DATA_DIR / "gdelt_daily_macro_tone.csv"


def find_col(frame: pd.DataFrame, names: tuple[str, ...]) -> str | None:
    columns = {str(col).strip().lower(): str(col) for col in frame.columns}
    return next((columns[name] for name in names if name in columns), None)


def import_tone(input_file: Path = INPUT_FILE, output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    if not input_file.exists():
        raise FileNotFoundError(
            f"GDELT query export not found: {input_file}\n"
            "Run queries/gdelt_macro_tone.sql in BigQuery and save its results here."
        )

    raw = pd.read_csv(input_file, low_memory=False)
    date_col = find_col(raw, ("date", "day", "daily_date", "date_utc"))
    tone_col = find_col(raw, ("avg_tone", "mean_tone", "tone"))
    count_col = find_col(raw, ("article_count", "articles", "count"))
    positive_col = find_col(raw, ("positive_articles", "positive_count"))
    negative_col = find_col(raw, ("negative_articles", "negative_count"))
    if not date_col or not tone_col or not count_col:
        raise ValueError(
            "GDELT export must contain daily date, avg_tone, and article_count. "
            f"Found: {list(raw.columns)}"
        )

    result = pd.DataFrame()
    result["date"] = pd.to_datetime(raw[date_col], errors="coerce", utc=True).dt.tz_convert(None).dt.normalize()
    result["avg_tone"] = pd.to_numeric(raw[tone_col], errors="coerce")
    result["article_count"] = pd.to_numeric(raw[count_col], errors="coerce")
    result["positive_count"] = pd.to_numeric(raw[positive_col], errors="coerce") if positive_col else 0
    result["negative_count"] = pd.to_numeric(raw[negative_col], errors="coerce") if negative_col else 0
    result = result.dropna(subset=["date", "avg_tone", "article_count"])
    result = result[result["article_count"] > 0].copy()

    # Keep the sentiment scale compatible with FinBERT's approximate [-1, 1].
    result["sentiment_score"] = (result["avg_tone"] / 100).clip(-1, 1)
    result["neutral_count"] = (
        result["article_count"] - result["positive_count"] - result["negative_count"]
    ).clip(lower=0)
    result["avg_confidence"] = 0.0  # GDELT tone is not a classifier confidence.
    result = result.drop_duplicates("date", keep="last").sort_values("date").reset_index(drop=True)
    result = result[
        ["date", "sentiment_score", "article_count", "positive_count",
         "negative_count", "neutral_count", "avg_confidence", "avg_tone"]
    ]

    output_file.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_file, index=False, date_format="%Y-%m-%d")
    print(f"Saved {len(result)} daily GDELT tone rows to {output_file}")
    if not result.empty:
        print(f"Coverage: {result['date'].min().date()} through {result['date'].max().date()}")
    return result


if __name__ == "__main__":
    import_tone()
