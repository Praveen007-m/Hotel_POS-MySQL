const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const db = require("./db/database");

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

// ================= CORS (FIXED FOR PRODUCTION) =================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Allow Netlify + localhost
      if (
        origin.includes("netlify.app") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
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

if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf-8");

  db.exec(schema, (err) => {
    if (err) {
      console.error("❌ DB Init Error:", err.message);
    } else {
      console.log("✅ Database ready");
    }
  });
}

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

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("🚀 Hotel backend API is running!");
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================= START SERVER (RAILWAY FIX) =================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
