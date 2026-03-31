const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const isProd = process.env.NODE_ENV === "production";
const configuredDbPath = process.env.SQLITE_DB_PATH;
const volumeMountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const bundledDbPath = path.join(__dirname, "hotel.db");
const seedDbPath = process.env.SQLITE_SEED_PATH || bundledDbPath;
const importBundledDb =
  process.env.SQLITE_IMPORT_ON_BOOT === "true" ||
  process.env.SQLITE_IMPORT_ON_BOOT === "1";

let dbPath;

if (configuredDbPath) {
  dbPath = configuredDbPath;
} else if (isProd && volumeMountPath) {
  dbPath = path.join(volumeMountPath, "hotel.db");
} else if (isProd) {
  dbPath = "/tmp/hotel.db";
} else {
  dbPath = bundledDbPath;
}

console.log("📁 Using DB Path:", dbPath);
console.log("📦 Seed DB Path:", seedDbPath);
console.log("📦 Import on boot enabled:", importBundledDb);
console.log("📦 Seed DB exists:", fs.existsSync(seedDbPath));
console.log("📦 Target DB exists before connect:", fs.existsSync(dbPath));

try {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (err) {
  console.error("❌ Failed to create DB directory:", err);
}

if (isProd && dbPath !== seedDbPath && fs.existsSync(seedDbPath)) {
  const targetExists = fs.existsSync(dbPath);

  if (importBundledDb && !targetExists) {
    try {
      fs.copyFileSync(seedDbPath, dbPath);
      console.log(`✅ Seed DB copied from ${seedDbPath} to ${dbPath}`);
    } catch (err) {
      console.error("❌ Failed to seed DB file:", err);
    }
  } else if (importBundledDb) {
    console.log("📦 Seed DB copy skipped:", {
      samePath: dbPath === seedDbPath,
      targetExists,
      seedExists: fs.existsSync(seedDbPath),
    });
  }
} else if (isProd && importBundledDb) {
  console.log("📦 Seed DB copy skipped:", {
    samePath: dbPath === seedDbPath,
    targetExists: fs.existsSync(dbPath),
    seedExists: fs.existsSync(seedDbPath),
  });
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

module.exports = db;
