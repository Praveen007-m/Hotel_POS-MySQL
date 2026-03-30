const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// ✅ Detect environment
const isProd = process.env.NODE_ENV === "production";

// ✅ Use /tmp for Railway (VERY IMPORTANT)
const dbPath = isProd
  ? "/tmp/hotel.db"
  : path.join(__dirname, "hotel.db");

console.log("📁 Using DB Path:", dbPath);

// ✅ Ensure directory exists (safety)
if (isProd) {
  try {
    if (!fs.existsSync("/tmp")) {
      fs.mkdirSync("/tmp", { recursive: true });
    }
  } catch (err) {
    console.error("❌ Failed to create /tmp directory:", err);
  }
}

// ✅ Create DB connection
const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error("❌ DB Connection Error:", err);
    } else {
      console.log("✅ SQLite connected");
    }
  }
);

// ✅ SAFE CONFIG (WAL can crash on Railway → disable in prod)
db.serialize(() => {
  if (!isProd) {
    db.run("PRAGMA journal_mode = WAL;");
  } else {
    db.run("PRAGMA journal_mode = DELETE;"); // safer for Railway
  }

  db.run("PRAGMA synchronous = NORMAL;");
  db.run("PRAGMA busy_timeout = 5000;");

  // ✅ Migration moved to server.js initDatabase() — runs after schema is created
});

// ✅ GLOBAL ERROR LOGGING
db.on("error", (err) => {
  console.error("💥 SQLite Runtime Error:", err);
});

module.exports = db;
