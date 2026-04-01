require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("./firebaseAdmin");
const { Pool } = require("pg");

const app = express();
const PORT = 3001;

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

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}

/*
  Public route
*/
app.get("/", (req, res) => {
  res.send("Backend running");
});

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

app.post("/login", async (req, res) => {
  const idToken = req.body.token;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Verified token for user:", decodedToken.uid);
    res.json({ success: true, uid: decodedToken.uid });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ success: false, error: error.message });
  }
});

// Hardcoded secret registration codes
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
  } else {
    return res.json({ valid: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/users/sync", verifyToken, async (req, res) => {
  const firebase_uid = req.user.uid;
  const email = req.user.email || null;
  const {firstName, lastName, accountType } = req.body;
  

  try {
    const result = await pool.query(
      `
      INSERT INTO users (firebase_uid, email, first_name, last_name, account_type)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        account_type = EXCLUDED.account_type
      RETURNING *;
      `,
      [firebase_uid, email, firstName || null, lastName||null, accountType || null]
    );

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error syncing user to Postgres:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});