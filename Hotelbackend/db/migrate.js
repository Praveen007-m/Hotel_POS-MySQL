// db/migrate.js
const db = require('./database');

/**
 * Migrations are run in ORDER.
 * Safe to re-run — duplicate column errors are silently ignored.
 * Add new migrations at the BOTTOM of this array only.
 */
const migrations = [
  // ── Bookings: columns added after initial schema ──────────────────────────
  `ALTER TABLE bookings ADD COLUMN advance_paid REAL DEFAULT 0`,
  `ALTER TABLE bookings ADD COLUMN add_ons TEXT DEFAULT '[]'`,
  `ALTER TABLE bookings ADD COLUMN people_count INTEGER DEFAULT 1`,
  `ALTER TABLE bookings ADD COLUMN created_by_id INTEGER`,
  `ALTER TABLE bookings ADD COLUMN created_by_name TEXT`,
  `ALTER TABLE bookings ADD COLUMN created_by_role TEXT`,

  // ── Staff: columns added after initial schema ─────────────────────────────
  `ALTER TABLE staff ADD COLUMN phone TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE staff ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`,

  // ── Users: staff_id FK column ─────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN staff_id INTEGER`,

  // ── Billings: is_downloaded flag ──────────────────────────────────────────
  `ALTER TABLE billings ADD COLUMN is_downloaded INTEGER DEFAULT 0`,

  // ── Rooms: capacity column ────────────────────────────────────────────────
  `ALTER TABLE rooms ADD COLUMN capacity INTEGER DEFAULT 2`,

  // ── Add future migrations BELOW this line ─────────────────────────────────
];

/**
 * Runs a single SQL statement and resolves regardless of "duplicate column" errors.
 * Rejects on any other DB error so we catch real problems.
 */
function runOne(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (!err) {
        console.log(`  ✅ Applied: ${sql.substring(0, 70)}...`);
        return resolve();
      }

      // These errors mean the migration already ran — safe to skip
      const alreadyDone =
        err.message.includes('duplicate column') ||
        err.message.includes('already exists');

      if (alreadyDone) {
        console.log(`  ⏭️  Skipped (already applied): ${sql.substring(0, 60)}...`);
        return resolve();
      }

      // Anything else is a real error
      console.error(`  ❌ Migration failed: ${err.message}`);
      console.error(`     SQL: ${sql}`);
      reject(err);
    });
  });
}

/**
 * Runs all pending migrations sequentially.
 * Call this from server.js during initDatabase(), before routes are registered.
 */
async function runMigrations() {
  console.log(`🔄 Running ${migrations.length} migration(s)...`);

  for (const sql of migrations) {
    await runOne(sql); // sequential — order matters
  }

  console.log('✅ All migrations complete.');
}

module.exports = { runMigrations };