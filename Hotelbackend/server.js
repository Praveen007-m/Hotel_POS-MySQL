const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const db = require("./db/database");
const { runMigrations } = require("./db/migrate");

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err);
});

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

const app = express();
const PORT = process.env.PORT || 5000;
let isDbReady = false;

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origin.includes("netlify.app") ||
      origin.includes("localhost") ||
      origin.includes("railway.app")
    ) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const schemaPath = path.join(__dirname, "db/schema.sql");
const requiredTables = ["users", "staff", "rooms", "customers", "bookings"];
const requiredBookingColumns = [
  "booking_id",
  "advance_paid",
  "add_ons",
  "people_count",
  "created_by_id",
  "created_by_name",
  "created_by_role",
];
const requiredStaffColumns = ["phone", "status"];
const requiredUserColumns = ["staff_id"];

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function execQuery(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function logTableCounts() {
  for (const table of requiredTables) {
    const row = await getQuery(`SELECT COUNT(*) AS count FROM ${table}`);
    console.log(`[db] ${table} row count:`, row.count);
  }
}

async function assertTableExists(tableName) {
  const row = await getQuery(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName]
  );

  if (!row) {
    throw new Error(`Required table missing: ${tableName}`);
  }
}

async function assertColumns(tableName, expectedColumns) {
  const rows = await allQuery(`PRAGMA table_info(${tableName})`);
  const actualColumns = new Set(rows.map((row) => row.name));
  const missingColumns = expectedColumns.filter(
    (column) => !actualColumns.has(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing columns in ${tableName}: ${missingColumns.join(", ")}`
    );
  }
}

async function verifyDatabaseState() {
  console.log("[db] Verifying schema in:", db.dbPath);

  for (const table of requiredTables) {
    await assertTableExists(table);
  }

  await assertColumns("bookings", requiredBookingColumns);
  await assertColumns("staff", requiredStaffColumns);
  await assertColumns("users", requiredUserColumns);

  const tables = await allQuery(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
  );
  console.log("[db] Tables:", tables.map((row) => row.name).join(", "));

  await logTableCounts();

  const roomsCount = await getQuery("SELECT COUNT(*) AS count FROM rooms");
  const customersCount = await getQuery(
    "SELECT COUNT(*) AS count FROM customers"
  );

  if (roomsCount.count === 0 || customersCount.count === 0) {
    console.warn(
      "[db] Production DB has schema but no base business data. Booking creation will fail until rooms and customers exist."
    );
  }
}

async function seedAdminUser() {
  return new Promise((resolve) => {
    const email = process.env.ADMIN_EMAIL || "admin@hotel.com";
    const password = process.env.ADMIN_PASSWORD || "Admin@2025#";
    const name = process.env.ADMIN_NAME || "Admin";

    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) {
        console.error("❌ Seed check error:", err.message);
        return resolve();
      }

      if (row) {
        console.log("✅ Admin user already exists");
        return resolve();
      }

      try {
        const hashed = await bcrypt.hash(password, 10);
        db.run(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          [name, email, hashed, "admin"],
          (insertErr) => {
            if (insertErr) {
              console.error("❌ Seed admin error:", insertErr.message);
            } else {
              console.log("✅ Admin user seeded:", email);
            }
            resolve();
          }
        );
      } catch (bcryptErr) {
        console.error("❌ bcrypt error:", bcryptErr.message);
        resolve();
      }
    });
  });
}

async function initDatabase() {
  try {
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at: ${schemaPath}`);
    }

    console.log("📁 Initializing database...");

    const schema = fs.readFileSync(schemaPath, "utf-8");
    await execQuery(schema);
    console.log("✅ Base schema applied");

    await runMigrations();
    await seedAdminUser();
    await verifyDatabaseState();

    console.log("✅ Database initialized successfully");
    isDbReady = true;
  } catch (err) {
    console.error("❌ DB Init Error:", err.message);
    console.error("❌ DB Init Path:", db.dbPath);
  }
}

app.use((req, res, next) => {
  if (!isDbReady) {
    return res.status(503).json({
      success: false,
      message: "Server initializing, please try again in a moment...",
    });
  }
  next();
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    db: isDbReady ? "ready" : "initializing",
    dbPath: db.dbPath,
  });
});

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

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

initDatabase().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
});
