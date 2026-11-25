# Free historical data setup

## Daily storage and refresh

The FastAPI service initializes `data/gold_sentiment.sqlite3` and imports the
existing gold history, FinBERT-scored news, and prior live headlines into it.
The database is the durable store; `gold_prices_25y.csv` is also updated so the
existing model/data scripts continue to use the same price history. The SQLite
file is local and ignored by Git.

While the backend is running, it fetches national (India-focused) and
international gold headlines, plus recent `GC=F` prices, on startup when no
successful run exists for the current India date and every day at 06:00 IST.
Temporary failures are recorded and retried hourly. Google News RSS is queried
for the last 24 hours; article publication time, fetch time, publisher, region,
URL, and scoring type are stored. Live RSS headlines remain unscored; no
FinBERT sentiment is fabricated for them.

Use these endpoints to inspect the stored data:

```text
GET /api/health
GET /api/data-coverage
GET /api/news?region=national&day=today
GET /api/news?region=international&day=today
GET /api/news?region=all&day=all&limit=100
```

To run the ingestion manually from the project root:

```powershell
python refresh_data.py
```

The daily gold updater uses `yfinance`, which is listed in the project
requirements. A failed provider request leaves the previous price/news records
intact and is visible from `/api/health` and `/api/data-coverage`. The API must
remain running for its in-process daily schedule to run. For a company
deployment, move this scheduler to a managed job service and use managed
database/storage plus a contracted data provider whose commercial-use terms
fit the product.

## Gold prices

The downloader uses Yahoo Finance's `GC=F` continuous COMEX gold futures series
through the `yfinance` Python package. This matches the project's existing
Yahoo `GC=F` price source and avoids mixing it with OTC spot bars. Yahoo's
historical prices are publicly viewable; programmatic downloads use the
unofficial `yfinance` client.

Install Node.js/npm, then run from the project root:

```powershell
python fetch_gold_history.py
```

This requests daily XAU/USD bid candles for the last 25 calendar years. The
original CSV is saved under `download/`; a normalized copy is written to
`data/gold_prices_25y.csv`. `clean_data.py` uses that file when it exists.

The source series is a continuous futures contract, not a spot gold quote.
Historical futures prices can be affected by contract roll adjustments.

## Historical news

There is no verified free 25-year archive of full financial-news article text
that can be passed to FinBERT. The GDELT DOC article-search endpoint is a recent
search service; its documentation limits explicit article date searches to
the most recent three months. GDELT 2.0's Global Knowledge Graph starts on
February 19, 2015 and provides article metadata and calculated tone, not full
article bodies. This gives about 11 years and 9 months of historical tone as
of November 2026, not 25 years. GDELT 1.0 event records go further back but
are not equivalent article-level sentiment data.

### Import free GDELT historical tone

`queries/gdelt_macro_tone.sql` aggregates GDELT GKG documents tagged with
verified macroeconomic themes (inflation, interest rates, central banks,
currencies, stock markets, and price) by day. GDELT does not have a verified
`ECON_GOLD` theme, so this provides a macro-news proxy that may affect gold,
not gold-specific sentiment. Run the query in BigQuery Studio against the
public `gdelt-bq` dataset, then export the result as
`data/gdelt_macro_tone_export.csv` and run:

```powershell
python import_gdelt_tone.py
```

This writes `data/gdelt_daily_macro_tone.csv`. `merge_data.py` uses this daily
tone where available and keeps FinBERT sentiment on dates without a GDELT row.
The GDELT score is overall document tone scaled to [-1, 1], not gold-specific
FinBERT analysis. The query/import path is ready, but the BigQuery export still
has to be run from your Google account. BigQuery has a free sandbox and 1 TiB
monthly query allowance; estimate processed bytes first and split the query by
date if the full scan exceeds available free quota. Training data starts
February 19, 2015 to avoid the earlier price-only period.

When a licensed archive export is available instead, place the CSV at
`data/news_archive_export.csv` with publication date, headline, and full article
text columns, then run `python import_news_archive.py`. No paid archive is
assumed by the project.

## Prediction target

The existing LSTM remains a next-session UP/DOWN classifier. It does not
predict an exact next-day dollar price.
