const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const db = require("./db/database");

// ================= GLOBAL CRASH HANDLER =================
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
});

// ================= ROUTES =================
const authRoutes = require("./routes/auth");
const staffRoutes = require("./routes/staff.routes");
const billingRoutes = require("./routes/billings");
const dashboardRoutes = require("./routes/dashboard.routes");
const customerRoutes = require("./routes/customers");
const bookingsRoutes = require("./routes/bookings");
const roomsRoutes = require("./routes/roomsRoutes");
const kitchenRoutes = require("./routes/kitchenRoutes");
const addonsRoutes = require("./routes/addons");
const expenseRoutes = require("./routes/expense");
const gstRoutes = require("./routes/gst.routes");
const restaurantRoutes = require("./routes/restaurant.routes");
const invoiceRoutes = require("./routes/invoice");

// ================= APP =================
const app = express();
const PORT = process.env.PORT || 5000;

// ================= DB READY FLAG =================
let isDbReady = false;

// ================= CORS =================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (
        origin.includes("netlify.app") ||
        origin.includes("localhost") ||
        origin.includes("hotel-poss.netlify.app") // ✅ add your exact domain
      ) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);
      return callback(null, false);
    },
    credentials: true,
  })
);

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= DATABASE INIT =================
const schemaPath = path.join(__dirname, "db/schema.sql");

// ================= MIGRATIONS =================
// Add any new ALTER TABLE migrations here.
// They are safe to run every time — duplicate column errors are ignored.
const migrations = [
  "ALTER TABLE billings ADD COLUMN is_downloaded INTEGER DEFAULT 0",
  // Add future migrations below:
  // "ALTER TABLE bookings ADD COLUMN some_new_col TEXT DEFAULT ''",
];

async function runMigrations() {
  for (const sql of migrations) {
    await new Promise((resolve) => {
      db.run(sql, (err) => {
        if (err && !err.message.includes("duplicate column")) {
          console.error("❌ Migration error:", err.message);
        } else {
          console.log("✅ Migration checked:", sql.substring(0, 60) + "...");
        }
        resolve(); // always resolve — migration errors are non-fatal
      });
    });
  }
}

async function initDatabase() {
  try {
    if (!fs.existsSync(schemaPath)) {
      throw new Error("schema.sql not found");
    }

    console.log("📁 Initializing DB...");

    const schema = fs.readFileSync(schemaPath, "utf-8");

    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // ✅ Step 1: Run all CREATE TABLE IF NOT EXISTS from schema.sql
    for (const stmt of statements) {
      await new Promise((resolve, reject) => {
        db.run(stmt, (err) => {
          if (err) {
            // Ignore safe errors
            if (
              err.message.includes("already exists") ||
              err.message.includes("duplicate column")
            ) {
              console.log("⚠️ Skipping:", err.message);
              return resolve();
            }

            console.error("❌ SQL Error:", err.message);
            return reject(err);
          }
          resolve();
        });
      });
    }

    console.log("✅ Schema applied successfully");

    // ✅ Step 2: Run migrations AFTER schema is ready
    await runMigrations();

    console.log("✅ Database initialized successfully");
    isDbReady = true;
  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
  }
}

// ================= DB READY MIDDLEWARE =================
app.use((req, res, next) => {
  if (!isDbReady) {
    return res.status(503).json({
      success: false,
      message: "Server initializing, please try again...",
    });
  }
  next();
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    db: isDbReady ? "ready" : "initializing",
  });
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/addons", addonsRoutes);
app.use("/api/billings", billingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/invoice", invoiceRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack || err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================= START SERVER =================
initDatabase().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});