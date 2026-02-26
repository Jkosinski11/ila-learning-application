require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("./firebaseAdmin");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});