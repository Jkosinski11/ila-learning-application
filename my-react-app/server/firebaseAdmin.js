const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn(
      "Firebase Admin credentials not found. Auth routes will be unavailable until credentials are configured."
    );
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error.message);
}

module.exports = admin;
