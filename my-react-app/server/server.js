const express = require("express");
const cors = require("cors");
const admin = require("./firebaseAdmin");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
//require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = "stocks-v3";
const firebaseReady = Array.isArray(admin.apps) && admin.apps.length > 0;

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const QUOTE_TTL_MS = 15 * 1000;
const SEARCH_TTL_MS = 45 * 1000;
const quoteCache = new Map();
const searchCache = new Map();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/*
  Token verification middleware
*/
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];

function ensureFmpKey(res) {
  if (!FMP_API_KEY) {
    res.status(500).json({ error: "FMP_API_KEY is not configured on backend." });
    return false;
  }

  return true;
}

function getCached(cache, key) {
  const hit = cache.get(key);
  if (!hit) return null;

  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }

  return hit.data;
}

function setCached(cache, key, data, ttlMs) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

function isStockInstrument(item) {
  const exchange = (item.exchangeShortName || item.exchange || "").toUpperCase();
  const type = (item.type || "").toLowerCase();

  const validExchange = ["NASDAQ", "NYSE", "AMEX"].includes(exchange);
  const notFund = !["etf", "fund", "crypto", "cryptocurrency"].includes(type);

  return validExchange && notFund;
}

async function fetchJsonOrThrow(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    const wrapped = new Error(`Network error reaching FMP: ${error.message}`);
    wrapped.status = 502;
    throw wrapped;
  }

  const rawText = await response.text();

  let json;
  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const messageFromJson =
      (json && (json.error || json.message || json[0]?.error)) || "";
    const message =
      messageFromJson ||
      (rawText ? rawText.slice(0, 180) : `HTTP ${response.status}`);

    const error = new Error(`FMP HTTP ${response.status}: ${message}`);
    error.status = response.status;
    throw error;
  }

  return json;
}

function normalizeQuoteItem(item, symbol) {
  return {
    symbol: item.symbol || symbol,
    name: item.name || null,
    price: item.price,
    change: item.change ?? null,
    changePercent: item.changePercent ?? item.changesPercentage ?? null,
    dayLow: item.dayLow ?? null,
    dayHigh: item.dayHigh ?? null,
    previousClose: item.previousClose ?? null,
    volume: item.volume ?? null,
    exchange: item.exchange ?? null,
    timestamp: item.timestamp ?? null,
  };
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    if (!firebaseReady) {
      return res.status(503).json({ error: "Auth service is not configured on backend." });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/", (req, res) => {
  res.send(`Backend running (${API_VERSION})`);
});

app.get("/ping", (req, res) => res.send("pong"));

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

app.get("/stocks/debug", async (req, res) => {
  if (!ensureFmpKey(res)) return;

  try {
    const url = `${FMP_BASE_URL}/search-symbol?query=AAPL&apikey=${encodeURIComponent(FMP_API_KEY)}`;
    const data = await fetchJsonOrThrow(url);
    return res.json({
      ok: true,
      version: API_VERSION,
      sampleCount: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) ? data.slice(0, 2) : data,
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      version: API_VERSION,
      error: error.message,
    });
  }
},

/*
  Public route
*/
app.get("/", (req, res) => {
  res.send("Backend running");
}));

/*
  Protected route
*/
app.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});

app.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});

app.post("/login", async (req, res) => {
  const idToken = req.body.token;

  try {
    if (!firebaseReady) {
      return res
        .status(503)
        .json({ success: false, error: "Auth service is not configured on backend." });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Verified token for user:", decodedToken.uid);
    return res.json({ success: true, uid: decodedToken.uid });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ success: false, error: error.message });
  }
});

app.get("/stocks/search", async (req, res) => {
  if (!ensureFmpKey(res)) return;

  const q = String(req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  const cacheKey = q.toUpperCase();
  const cached = getCached(searchCache, cacheKey);
  if (cached) {
    return res.json({ results: cached, cached: true, version: API_VERSION });
  }

  try {
    const url = `${FMP_BASE_URL}/search-symbol?query=${encodeURIComponent(q)}&apikey=${encodeURIComponent(FMP_API_KEY)}`;
    const payload = await fetchJsonOrThrow(url);

    const normalized = (Array.isArray(payload) ? payload : [])
      .filter(isStockInstrument)
      .slice(0, 10)
      .map((item) => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchangeShortName || item.exchange,
        currency: item.currency || "USD",
        type: item.type || "stock",
      }));

    setCached(searchCache, cacheKey, normalized, SEARCH_TTL_MS);
    return res.json({ results: normalized, cached: false, version: API_VERSION });
  } catch (error) {
    console.error("Stock search error:", error);
    return res.status(502).json({
      error: `(${API_VERSION}) Failed to fetch stock search results: ${error.message}`,
    });
  }
});

app.get("/stocks/quote", async (req, res) => {
  if (!ensureFmpKey(res)) return;

  const symbol = String(req.query.symbol || "").trim().toUpperCase();
  if (!symbol) {
    return res.status(400).json({ error: "Query parameter 'symbol' is required." });
  }

  const cached = getCached(quoteCache, symbol);
  if (cached) {
    return res.json({ quote: cached, cached: true, version: API_VERSION });
  }

  try {
    let payload;

    try {
      const batchUrl = `${FMP_BASE_URL}/batch-quote-short?symbols=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(FMP_API_KEY)}`;
      payload = await fetchJsonOrThrow(batchUrl);
    } catch (batchError) {
      if (batchError.status !== 402) {
        throw batchError;
      }

      const shortUrl = `${FMP_BASE_URL}/quote-short?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(FMP_API_KEY)}`;
      payload = await fetchJsonOrThrow(shortUrl);
    }

    const item = Array.isArray(payload) ? payload[0] : null;

    if (!item) {
      return res.status(404).json({ error: "Quote not found for symbol." });
    }

    const quote = normalizeQuoteItem(item, symbol);

    setCached(quoteCache, symbol, quote, QUOTE_TTL_MS);
    return res.json({ quote, cached: false, version: API_VERSION });
  } catch (error) {
    console.error("Stock quote error:", error);
    return res.status(502).json({
      error: `(${API_VERSION}) Failed to fetch stock quote: ${error.message}`,
    });
  }
});

const REGISTRATION_CODES = {
  teacher: "TEACH2026",
  admin: "ADMIN2026",
};

app.post("/verify-code", (req, res) => {
  const { accountType, secretCode } = req.body;

  if (!REGISTRATION_CODES[accountType]) {
    return res.status(400).json({ valid: false, error: "Invalid account type" });
  }

  if (secretCode === REGISTRATION_CODES[accountType]) {
    return res.json({ valid: true });
  }

  return res.json({ valid: false });
});

async function waitForDb(retries = 30, delayMs = 1000) {
  for (let i = 1; i <= retries; i += 1) {
    try {
      await pool.query("SELECT 1");
      console.log("DB is reachable");
      return;
    } catch (error) {
      console.log(`DB not ready yet (${i}/${retries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("DB not reachable after retries");
}

async function runMigrations() {
  const dir = process.env.MIGRATIONS_DIR || path.join(__dirname, "..", "backend");
  const file = process.env.MIGRATION_FILE || "db_init.sql";
  const fullPath = path.join(dir, file);

  console.log("Running migration:", fullPath);

  if (!REGISTRATION_CODES[accountType]) {
    return res.status(400).json({ valid: false, error: "Invalid account type" });
  }

  console.log("Migration applied");
}

async function start() {
  if (process.env.DATABASE_URL) {
    await waitForDb();
    await runMigrations();
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT} (${API_VERSION})`);
  });
}

start().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
})};