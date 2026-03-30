const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const isProd = process.env.NODE_ENV === "production";
const explicitDbPath = process.env.SQLITE_DB_PATH || process.env.DB_PATH;
const volumeMountPath =
  process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.VOLUME_MOUNT_PATH;
const defaultLocalPath = path.join(__dirname, "hotel.db");

let dbPath = defaultLocalPath;

if (explicitDbPath) {
  dbPath = path.resolve(explicitDbPath);
} else if (isProd && volumeMountPath) {
  dbPath = path.join(volumeMountPath, "hotel.db");
} else if (isProd) {
  dbPath = "/tmp/hotel.db";
}

const dbDir = path.dirname(dbPath);
const existedBeforeConnect = fs.existsSync(dbPath);

console.log("[db] NODE_ENV:", process.env.NODE_ENV || "(unset)");
console.log("[db] Using DB Path:", dbPath);
console.log("[db] DB existed before connect:", existedBeforeConnect);

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (err) {
  console.error("❌ Failed to create DB directory:", dbDir, err);
}

if (isProd && !explicitDbPath && !volumeMountPath) {
  console.warn(
    "[db] No persistent volume path configured. Using ephemeral SQLite file:",
    dbPath
  );
}

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

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  if (!isProd) {
    db.run("PRAGMA journal_mode = WAL;");
  } else {
    db.run("PRAGMA journal_mode = DELETE;");
  }

  db.run("PRAGMA synchronous = NORMAL;");
  db.run("PRAGMA busy_timeout = 5000;");
});

db.on("error", (err) => {
  console.error("💥 SQLite Runtime Error:", err);
});

db.dbPath = dbPath;

module.exports = db;
