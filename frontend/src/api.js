// Relative API paths use the Vite proxy locally and same-origin FastAPI in
// the single-service production deployment. Separate hosts set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || "";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  dashboard: () => get("/api/dashboard"),

  price: (period) => get(`/api/price?period=${period}`),

  dataCoverage: () => get("/api/data-coverage"),

  sentiment: (days = 60, region = "all") =>
    get(`/api/sentiment?days=${days}&region=${encodeURIComponent(region)}`),

  news: (region = "all", day = "today", limit = 100) =>
    get(`/api/news?region=${encodeURIComponent(region)}&day=${encodeURIComponent(day)}&limit=${limit}`),

  macro: () => get("/api/macro"),

  modelPerformance: () => get("/api/model-performance"),

  about: () => get("/api/about"),
};
