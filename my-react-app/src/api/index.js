import { mockClient } from "./mockClient";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

async function request(path) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`);
  } catch (error) {
    throw new Error(
      `Cannot reach backend at ${API_BASE}. Start backend server (node backend/server.js).`
    );
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }

  return payload;
}

export const marketApi = {
  async searchStocks(query) {
    const q = String(query || "").trim();
    if (!q) return [];

    const data = await request(`/stocks/search?q=${encodeURIComponent(q)}`);
    return data.results || [];
  },

  async getStockQuote(symbol) {
    const data = await request(`/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
    return data.quote;
  },
};

export const api = mockClient;
