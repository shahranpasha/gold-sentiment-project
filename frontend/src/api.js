const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  sentiment: (days = 60) => get(`/api/sentiment?days=${days}`),

  macro: () => get("/api/macro"),

  modelPerformance: () => get("/api/model-performance"),

  about: () => get("/api/about"),
};