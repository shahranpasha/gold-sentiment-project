# Production deployment

The app can run as one Docker web service: FastAPI serves the built React app
and `/api/*` from the same HTTPS origin. The container listens on `$PORT`.

## Required service settings

- Build from the repository `Dockerfile`.
- Attach persistent storage at `/var/data` and keep
  `GOLD_SENTIMENT_DB=/var/data/gold_sentiment.sqlite3`.
- Keep one backend instance while SQLite is the database. Do not run multiple
  replicas against the same SQLite file.
- Allow outbound HTTPS so the daily Yahoo Finance and Google News RSS jobs can
  refresh. The API must stay running for its in-process daily scheduler.
- Use the host's HTTPS URL. For a separate frontend host, set
  `VITE_API_URL` at frontend build time and set
  `GOLD_SENTIMENT_CORS_ORIGINS` to that exact frontend origin.
- Optional legacy provider credentials belong in the host's secret settings;
  see `.env.example` for variable names. Never commit real `.env` files.

## Local container run

```powershell
docker build -t gold-sentiment .
docker run --rm -p 8000:8000 -v gold-sentiment-data:/var/data gold-sentiment
```

Open `http://localhost:8000`. The dashboard and API share that origin. The
first startup can take longer while the model loads and the price-history job
initializes. `/api/health` reports whether the model loaded and the latest
pipeline runs.

## Before making the repository public

Two legacy scripts previously contained provider keys in tracked source files;
they now read environment variables. Rotate those provider keys before any
public deployment because the old values may remain in Git history or remote
copies. Also confirm the repository contains no real `.env` file and configure
production secrets in the hosting platform.

The service publishes current stored gold prices and RSS headlines. Live RSS
headlines are not FinBERT-scored by the current pipeline, and model weights are
not retrained automatically. Historical macro/news coverage and latest source
dates are shown in the app; production use needs data-provider terms and
monitoring appropriate to its audience.

## Render native Python service

If the Render service is configured with the native Python runtime instead of
the repository Dockerfile, set these service fields in Render:

- Root directory: repository root
- Build command: `pip install -r requirements.txt && npm ci --prefix frontend && npm run build --prefix frontend`
- Start command: `uvicorn Dashboard.api:app --host 0.0.0.0 --port $PORT`

The frontend build step is required because FastAPI serves `frontend/dist` in a
single-service deployment. The API import supports both the root-level Render
command above and local launches from `Dashboard/`. Attach a persistent disk and
set `GOLD_SENTIMENT_DB` to a path on that disk if collected news and prices
should survive service restarts and deploys.
