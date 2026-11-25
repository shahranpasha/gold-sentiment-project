"""Normalize a licensed historical news archive export for the FinBERT pipeline.

Use a provider export with article-text rights (for example, an LSEG Machine
Readable News archive). This importer does not scrape publisher sites or
fabricate older articles.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
INPUT_FILE = DATA_DIR / "news_archive_export.csv"
OUTPUT_FILE = DATA_DIR / "raw_news_archive.csv"


def first_existing_column(frame: pd.DataFrame, names: tuple[str, ...]) -> Optional[str]:
    lookup = {str(column).strip().lower(): str(column) for column in frame.columns}
    return next((lookup[name] for name in names if name in lookup), None)


def import_archive(input_file: Path = INPUT_FILE, output_file: Path = OUTPUT_FILE) -> pd.DataFrame:
    if not input_file.exists():
        raise FileNotFoundError(
            f"Historical archive export not found: {input_file}\n"
            "Place a licensed provider CSV there with publication date, title, and article text."
        )
    raw = pd.read_csv(input_file, low_memory=False)
    date_col = first_existing_column(raw, ("date", "published_at", "publishedat", "timestamp", "firstcreated"))
    title_col = first_existing_column(raw, ("title", "headline", "subject"))
    text_col = first_existing_column(raw, ("text", "story", "body", "full_text", "fulltext", "content", "description"))
    if not date_col or not title_col or not text_col:
        raise ValueError(
            "Archive CSV needs date/published_at, title/headline, and text/story/body columns. "
            f"Found: {list(raw.columns)}"
        )
    source_col = first_existing_column(raw, ("source", "provider", "publisher"))
    url_col = first_existing_column(raw, ("url", "link", "story_url"))
    dates = pd.to_datetime(raw[date_col], errors="coerce", utc=True)
    result = pd.DataFrame({
        "date": dates,
        "source": raw[source_col].fillna("Historical archive").astype(str) if source_col else "Historical archive",
        "title": raw[title_col].fillna("").astype(str),
        "description": raw[text_col].fillna("").astype(str),
        "text": raw[text_col].fillna("").astype(str),
        "url": raw[url_col].fillna("").astype(str) if url_col else "",
    })
    result = result.dropna(subset=["date"])
    result["date"] = result["date"].dt.tz_convert(None)
    result = result[result["title"].str.strip().ne("") & result["text"].str.strip().ne("")]
    has_url = result["url"].str.strip().ne("")
    result = pd.concat(
        [
            result.loc[has_url].drop_duplicates(subset=["url"], keep="first"),
            result.loc[~has_url],
        ],
        ignore_index=True,
    )
    result = result.drop_duplicates(subset=["title", "date"], keep="first")
    result = result.sort_values("date").reset_index(drop=True)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_file, index=False)
    print(f"Imported {len(result)} articles to {output_file}")
    if not result.empty:
        print(f"Date range: {result['date'].min().date()} through {result['date'].max().date()}")
        print(f"Distinct publication dates: {result['date'].dt.date.nunique()}")
    return result


if __name__ == "__main__":
    import_archive()
