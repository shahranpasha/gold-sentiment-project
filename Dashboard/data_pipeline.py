"""Persistent daily market/news ingestion for the Gold Sentiment dashboard.

The local SQLite database is the durable store. Existing CSV files are imported
once for continuity; newly fetched records are upserted so repeat runs are safe.
"""

from __future__ import annotations

import os
import sqlite3
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote_plus
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = Path(os.environ.get("GOLD_SENTIMENT_DB", DATA_DIR / "gold_sentiment.sqlite3"))
PRICE_CSV = DATA_DIR / "gold_prices_25y.csv"
SCORED_NEWS_CSV = DATA_DIR / "sentiment_news.csv"
LEGACY_LIVE_NEWS_CSV = DATA_DIR / "live_news.csv"
LOCAL_TZ = ZoneInfo("Asia/Kolkata")
UTC = timezone.utc

NEWS_FEEDS = {
    "national": {
        "query": '("gold rate" OR "gold price" OR bullion) India',
        "hl": "en-IN",
        "gl": "IN",
        "ceid": "IN:en",
    },
    "international": {
        "query": '("gold price" OR "gold prices" OR bullion OR XAUUSD OR "gold futures")',
        "hl": "en-US",
        "gl": "US",
        "ceid": "US:en",
    },
}

NEWS_COLUMNS = [
    "date", "published_at", "fetched_at", "region", "source", "title",
    "description", "text", "url", "sentiment", "confidence", "news_type",
]


def utc_now() -> datetime:
    return datetime.now(UTC)


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


def init_database() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS schema_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS gold_prices (
                symbol TEXT NOT NULL DEFAULT 'GC=F',
                date TEXT NOT NULL,
                open REAL,
                high REAL,
                low REAL,
                close REAL NOT NULL,
                volume REAL,
                source TEXT NOT NULL,
                fetched_at TEXT NOT NULL,
                PRIMARY KEY(symbol, date)
            );
            CREATE TABLE IF NOT EXISTS news_articles (
                region TEXT NOT NULL,
                url TEXT NOT NULL,
                date TEXT NOT NULL,
                published_at TEXT NOT NULL,
                fetched_at TEXT NOT NULL,
                source TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                text TEXT NOT NULL DEFAULT '',
                sentiment TEXT NOT NULL DEFAULT '',
                confidence REAL,
                news_type TEXT NOT NULL,
                PRIMARY KEY(region, url)
            );
            CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
            CREATE INDEX IF NOT EXISTS idx_news_region_date ON news_articles(region, date DESC);
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pipeline TEXT NOT NULL,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                status TEXT NOT NULL,
                records INTEGER NOT NULL DEFAULT 0,
                error TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_pipeline_runs_latest ON pipeline_runs(pipeline, id DESC);
            """
        )
        invalid = conn.execute(
            "SELECT COUNT(*) FROM news_articles WHERE region NOT IN ('national','international','historical','unknown')"
        ).fetchone()[0]
        if invalid:
            # Repair rows produced by pre-1.0 local builds that used the CSV
            # column order instead of the SQL schema order.
            conn.execute(
                "DELETE FROM news_articles WHERE region NOT IN ('national','international','historical','unknown')"
            )
            conn.execute("DELETE FROM schema_meta WHERE key IN ('scored_news_csv_seeded','live_news_csv_seeded')")
    seed_existing_files()


def _iso_date(value) -> str | None:
    stamp = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(stamp):
        return None
    return stamp.strftime("%Y-%m-%d")


def _as_utc_iso(value) -> str | None:
    stamp = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(stamp):
        return None
    return stamp.isoformat()


def _already_seeded(key: str) -> bool:
    with connect() as conn:
        return conn.execute("SELECT 1 FROM schema_meta WHERE key=?", (key,)).fetchone() is not None


def _mark_seeded(key: str) -> None:
    with connect() as conn:
        conn.execute("INSERT OR REPLACE INTO schema_meta(key,value) VALUES(?,?)", (key, utc_now().isoformat()))


def seed_existing_files() -> None:
    """Import the project's existing CSV data once without discarding its history."""
    if PRICE_CSV.exists() and not _already_seeded("prices_csv_seeded"):
        frame = pd.read_csv(PRICE_CSV)
        upsert_prices(frame, source="Yahoo Finance CSV")
        _mark_seeded("prices_csv_seeded")

    if SCORED_NEWS_CSV.exists() and not _already_seeded("scored_news_csv_seeded"):
        frame = pd.read_csv(SCORED_NEWS_CSV)
        if not frame.empty:
            rows = []
            now = utc_now().isoformat()
            for _, row in frame.iterrows():
                day = _iso_date(row.get("date"))
                title = str(row.get("title") or "").strip()
                if not day or not title:
                    continue
                url = str(row.get("url") or f"legacy://finbert/{day}/{title[:120]}")
                rows.append({
                    "date": day, "published_at": _as_utc_iso(row.get("published_at") or day) or now,
                    "fetched_at": now, "region": "historical", "source": str(row.get("source") or "Historical FinBERT"),
                    "title": title, "description": str(row.get("description") or ""),
                    "text": str(row.get("text") or row.get("title") or ""), "url": url,
                    "sentiment": str(row.get("sentiment") or ""),
                    "confidence": _float_or_none(row.get("confidence")), "news_type": "finbert_scored",
                })
            upsert_news(rows)
        _mark_seeded("scored_news_csv_seeded")

    if LEGACY_LIVE_NEWS_CSV.exists() and not _already_seeded("live_news_csv_seeded"):
        frame = pd.read_csv(LEGACY_LIVE_NEWS_CSV)
        rows = []
        now = utc_now().isoformat()
        for _, row in frame.iterrows():
            day = _iso_date(row.get("date"))
            title = str(row.get("title") or "").strip()
            url = str(row.get("url") or "").strip()
            if not day or not title or not url:
                continue
            rows.append({
                "date": day, "published_at": _as_utc_iso(row.get("published_at") or day) or now,
                "fetched_at": now, "region": str(row.get("region") or "international"),
                "source": str(row.get("source") or "Google News RSS"), "title": title,
                "description": str(row.get("description") or ""), "text": str(row.get("text") or title),
                "url": url, "sentiment": str(row.get("sentiment") or ""),
                "confidence": _float_or_none(row.get("confidence")), "news_type": "live_headline",
            })
        upsert_news(rows)
        _mark_seeded("live_news_csv_seeded")


def _float_or_none(value):
    try:
        number = float(value)
        return number if pd.notna(number) else None
    except (TypeError, ValueError):
        return None


def upsert_prices(frame: pd.DataFrame, source: str = "Yahoo Finance") -> int:
    if frame is None or frame.empty or "date" not in frame.columns:
        return 0
    normalized = frame.copy()
    normalized.columns = [str(col).lower() for col in normalized.columns]
    now = utc_now().isoformat()
    rows = []
    for _, record in normalized.iterrows():
        day = _iso_date(record.get("date"))
        close = _float_or_none(record.get("close"))
        if not day or close is None:
            continue
        rows.append((
            "GC=F", day, _float_or_none(record.get("open")), _float_or_none(record.get("high")),
            _float_or_none(record.get("low")), close, _float_or_none(record.get("volume")), source, now,
        ))
    if not rows:
        return 0
    with connect() as conn:
        conn.executemany(
            """INSERT INTO gold_prices(symbol,date,open,high,low,close,volume,source,fetched_at)
               VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(symbol,date) DO UPDATE SET
               open=excluded.open, high=excluded.high, low=excluded.low, close=excluded.close,
               volume=excluded.volume, source=excluded.source, fetched_at=excluded.fetched_at""",
            rows,
        )
    return len(rows)


def upsert_news(rows: list[dict]) -> int:
    if not rows:
        return 0
    with connect() as conn:
        conn.executemany(
            """INSERT INTO news_articles(region,url,date,published_at,fetched_at,source,title,
               description,text,sentiment,confidence,news_type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(region,url) DO UPDATE SET date=excluded.date,
               published_at=excluded.published_at, fetched_at=excluded.fetched_at,
               source=excluded.source,title=excluded.title,description=excluded.description,
               text=excluded.text,sentiment=excluded.sentiment,confidence=excluded.confidence,
               news_type=excluded.news_type""",
            [(
                row.get("region", "historical"), row.get("url", ""), row.get("date", ""),
                row.get("published_at", ""), row.get("fetched_at", ""), row.get("source", ""),
                row.get("title", ""), row.get("description", ""), row.get("text", ""),
                row.get("sentiment", ""), row.get("confidence"), row.get("news_type", "live_headline"),
            ) for row in rows],
        )
    return len(rows)


def start_run(name: str) -> int:
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO pipeline_runs(pipeline,started_at,status) VALUES(?,?,'running')",
            (name, utc_now().isoformat()),
        )
        return int(cur.lastrowid)


def finish_run(run_id: int, status: str, records: int = 0, error: str | None = None) -> None:
    safe_error = str(error)[:500] if error else None
    with connect() as conn:
        conn.execute(
            "UPDATE pipeline_runs SET completed_at=?,status=?,records=?,error=? WHERE id=?",
            (utc_now().isoformat(), status, records, safe_error, run_id),
        )
        conn.execute(
            "DELETE FROM pipeline_runs WHERE id NOT IN (SELECT id FROM pipeline_runs ORDER BY id DESC LIMIT 500)"
        )


def _is_relevant_title(title: str) -> bool:
    text = title.casefold()
    if not text.strip():
        return False
    noise = (
        "memory card", "cfexpress", "golden retriever", "golden state warriors",
        "gold card", "goldfish", "chart image", "month day, year",
    )
    if any(term in text for term in noise):
        return False
    mentions_gold = any(term in text for term in ("gold", "bullion", "xau"))
    finance_context = any(term in text for term in (
        "price", "rate", "market", "futures", "bullion", "xau", "ounce", "spot",
        "precious metal", "jewell", "jewel", "demand", "trading", "rally", "rises",
        "falls", "surge", "slips", "central bank", "reserve", "inflation",
    ))
    return mentions_gold and finance_context


def fetch_news_region(region: str) -> tuple[int, str | None]:
    run_id = start_run(f"news_{region}")
    config = NEWS_FEEDS[region]
    query = quote_plus(f"{config['query']} when:1d")
    url = (
        f"https://news.google.com/rss/search?q={query}&hl={config['hl']}"
        f"&gl={config['gl']}&ceid={config['ceid']}"
    )
    request = Request(url, headers={"User-Agent": "GoldSentimentResearch/1.0 (RSS reader)"})
    try:
        with urlopen(request, timeout=25) as response:
            root = ET.fromstring(response.read())
        fetched_at = utc_now().isoformat()
        rows = []
        for item in root.findall(".//item"):
            title = str(item.findtext("title") or "").strip()
            link = str(item.findtext("link") or "").strip()
            published = pd.to_datetime(item.findtext("pubDate"), errors="coerce", utc=True)
            if not link or pd.isna(published) or not _is_relevant_title(title):
                continue
            source_node = item.find("source")
            source = (source_node.text or "Google News") if source_node is not None else "Google News"
            rows.append({
                "date": published.tz_convert(LOCAL_TZ).strftime("%Y-%m-%d"), "published_at": published.isoformat(),
                "fetched_at": fetched_at, "region": region, "source": source, "title": title,
                "description": "", "text": title, "url": link, "sentiment": "",
                "confidence": None, "news_type": "live_headline",
            })
        # An empty but valid RSS response is still a successful daily run.
        records = upsert_news(rows)
        finish_run(run_id, "success", records)
        return records, None
    except Exception as exc:
        finish_run(run_id, "failed", error=f"{type(exc).__name__}: {exc}")
        return 0, f"{type(exc).__name__}: {exc}"


def refresh_gold_prices() -> tuple[int, str | None]:
    run_id = start_run("gold_prices")
    try:
        import yfinance as yf

        ticker = yf.Ticker("GC=F")
        with connect() as conn:
            last = conn.execute("SELECT MAX(date) FROM gold_prices WHERE symbol='GC=F'").fetchone()[0]
        today = datetime.now(LOCAL_TZ).date()
        if last:
            start = pd.to_datetime(last).date() - timedelta(days=10)
            history = ticker.history(start=start.isoformat(), end=(today + timedelta(days=1)).isoformat(), interval="1d", auto_adjust=False, actions=False)
        else:
            history = ticker.history(period="25y", interval="1d", auto_adjust=False, actions=False)
        if history.empty:
            raise RuntimeError("Yahoo Finance returned no recent gold prices.")
        history = history.reset_index()
        date_column = "Date" if "Date" in history.columns else "Datetime"
        history = history.rename(columns={date_column: "date"})
        history["date"] = pd.to_datetime(history["date"], errors="coerce", utc=True).dt.tz_convert(None).dt.normalize()
        history = history.dropna(subset=["date"])
        records = upsert_prices(history)
        # Keep the existing project CSV in sync for model scripts and legacy readers.
        cached = pd.read_csv(PRICE_CSV) if PRICE_CSV.exists() else pd.DataFrame()
        current = history.copy()
        if not cached.empty:
            current = pd.concat([cached, current], ignore_index=True, sort=False)
        current["date"] = pd.to_datetime(current["date"], errors="coerce", utc=True).dt.tz_localize(None).dt.normalize()
        current = current.dropna(subset=["date"]).drop_duplicates("date", keep="last").sort_values("date")
        PRICE_CSV.parent.mkdir(parents=True, exist_ok=True)
        current.to_csv(PRICE_CSV, index=False, date_format="%Y-%m-%d")
        finish_run(run_id, "success", records)
        return records, None
    except Exception as exc:
        finish_run(run_id, "failed", error=f"{type(exc).__name__}: {exc}")
        return 0, f"{type(exc).__name__}: {exc}"


def refresh_all() -> dict:
    init_database()
    results = {}
    for region in ("national", "international"):
        count, error = fetch_news_region(region)
        results[f"news_{region}"] = {"records": count, "error": error}
    count, error = refresh_gold_prices()
    results["gold_prices"] = {"records": count, "error": error}
    return results


def latest_runs() -> dict:
    with connect() as conn:
        rows = conn.execute(
            """SELECT p.* FROM pipeline_runs p JOIN
               (SELECT pipeline,MAX(id) id FROM pipeline_runs GROUP BY pipeline) latest
               ON latest.id=p.id"""
        ).fetchall()
    return {row["pipeline"]: dict(row) for row in rows}


def load_live_news() -> pd.DataFrame:
    with connect() as conn:
        frame = pd.read_sql_query(
            "SELECT date,published_at,fetched_at,region,source,title,description,text,url,sentiment,confidence,news_type "
            "FROM news_articles WHERE news_type='live_headline' ORDER BY published_at DESC LIMIT 1000", conn,
        )
    if not frame.empty:
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
        frame["published_at"] = pd.to_datetime(frame["published_at"], errors="coerce", utc=True)
    return frame


def query_news(region: str = "all", day: str = "today", limit: int = 100) -> pd.DataFrame:
    where = ["news_type='live_headline'"]
    params: list[object] = []
    if region in NEWS_FEEDS:
        where.append("region=?")
        params.append(region)
    if day == "today":
        where.append("date=?")
        params.append(datetime.now(LOCAL_TZ).date().isoformat())
    elif day != "all":
        parsed = _iso_date(day)
        if not parsed:
            return pd.DataFrame(columns=NEWS_COLUMNS)
        where.append("date=?")
        params.append(parsed)
    params.append(max(1, min(int(limit), 500)))
    with connect() as conn:
        return pd.read_sql_query(
            "SELECT date,published_at,fetched_at,region,source,title,description,text,url,sentiment,confidence,news_type "
            f"FROM news_articles WHERE {' AND '.join(where)} ORDER BY published_at DESC LIMIT ?",
            conn,
            params=params,
        )


def news_counts() -> dict:
    with connect() as conn:
        rows = conn.execute(
            "SELECT region,COUNT(*) count,MIN(date) start,MAX(date) end FROM news_articles "
            "WHERE news_type='live_headline' GROUP BY region"
        ).fetchall()
    return {row["region"]: dict(row) for row in rows}


def price_coverage() -> dict:
    with connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) rows,MIN(date) start,MAX(date) end,"
            "(SELECT close FROM gold_prices WHERE symbol='GC=F' ORDER BY date DESC LIMIT 1) latest_close "
            "FROM gold_prices WHERE symbol='GC=F'"
        ).fetchone()
    return dict(row) if row else {"rows": 0, "start": None, "end": None, "latest_close": None}


def load_stored_prices() -> pd.DataFrame:
    """Read the durable price history, including when a deploy has no CSV cache."""
    with connect() as conn:
        return pd.read_sql_query(
            "SELECT date,open,high,low,close,volume FROM gold_prices "
            "WHERE symbol='GC=F' ORDER BY date",
            conn,
        )


def should_refresh_today(pipeline_names: tuple[str, ...]) -> bool:
    today = datetime.now(LOCAL_TZ).date().isoformat()
    runs = latest_runs()
    for name in pipeline_names:
        run = runs.get(name)
        if not run or run["status"] != "success" or not str(run["completed_at"] or "").startswith(today):
            return True
    return False


def daily_refresh_due(force: bool = False) -> None:
    init_database()
    today = datetime.now(LOCAL_TZ).date().isoformat()
    runs = latest_runs()
    jobs = {
        "news_national": lambda: fetch_news_region("national"),
        "news_international": lambda: fetch_news_region("international"),
        "gold_prices": refresh_gold_prices,
    }
    for name, run_job in jobs.items():
        previous = runs.get(name)
        already_succeeded = (
            previous
            and previous.get("status") == "success"
            and str(previous.get("completed_at") or "").startswith(today)
        )
        if force or not already_succeeded:
            run_job()


def next_daily_refresh_seconds(hour: int = 6, minute: int = 0) -> float:
    now = datetime.now(LOCAL_TZ)
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return max(1.0, (target - now).total_seconds())
