// server/server.js (CommonJS)
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get("/ping", (req, res) => res.send("pong"));
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

async function waitForDb(retries = 30, delayMs = 1000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ DB is reachable");
      return;
    } catch (e) {
      console.log(`⏳ DB not ready yet (${i}/${retries})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("DB not reachable after retries");
}

async function runMigrations() {
  // MIGRATIONS_DIR will be set in docker-compose; default works locally too
  const dir = process.env.MIGRATIONS_DIR || path.join(__dirname, "..", "migrations");
  const file = process.env.MIGRATION_FILE || "db_init.sql";
  const fullPath = path.join(dir, file);

  console.log("📦 Running migration:", fullPath);

  const sql = fs.readFileSync(fullPath, "utf8");
  await pool.query(sql);

  console.log("✅ Migration applied");
}

async function start() {
  await waitForDb();
  await runMigrations();

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ Backend listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error("❌ Server startup failed:", e);
  process.exit(1);
});