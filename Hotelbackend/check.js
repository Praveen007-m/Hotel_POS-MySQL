const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath =
  process.env.SQLITE_DB_PATH ||
  process.env.DB_PATH ||
  path.join(__dirname, "db", "hotel.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to open DB:", dbPath, err.message);
    process.exit(1);
  }
});

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function main() {
  console.log("[check] DB path:", dbPath);

  const tables = await all(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
  );
  console.log("[check] Tables:", tables.map((row) => row.name).join(", "));

  for (const table of ["users", "staff", "rooms", "customers", "bookings"]) {
    const count = await get(`SELECT COUNT(*) AS count FROM ${table}`);
    console.log(`[check] ${table}:`, count.count);
  }

  const bookingsColumns = await all("PRAGMA table_info(bookings)");
  const staffColumns = await all("PRAGMA table_info(staff)");
  const usersColumns = await all("PRAGMA table_info(users)");

  console.log(
    "[check] bookings columns:",
    bookingsColumns.map((row) => row.name).join(", ")
  );
  console.log(
    "[check] staff columns:",
    staffColumns.map((row) => row.name).join(", ")
  );
  console.log(
    "[check] users columns:",
    usersColumns.map((row) => row.name).join(", ")
  );
}

main()
  .catch((err) => {
    console.error("❌ DB inspection failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
