const BASE = "/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  dashboard: () => get("/dashboard"),
  price: (period) => get(`/price?period=${period}`),
  sentiment: (days = 60) => get(`/sentiment?days=${days}`),
  macro: () => get("/macro"),
  modelPerformance: () => get("/model-performance"),
  about: () => get("/about"),
};
