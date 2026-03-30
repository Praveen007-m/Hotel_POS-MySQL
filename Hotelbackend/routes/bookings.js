const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

// Promisified db.run
const runQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

// Promisified db.get
const getQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

// Promisified db.all
const allQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

// ----------------- Routes -----------------
// IMPORTANT: Specific routes BEFORE generic /:id routes

// GET - BOOKINGS FOR CALENDAR VIEW
router.get("/calendar", requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT
        b.id,
        b.booking_id,
        b.room_id,
        datetime(b.check_in)  AS check_in,
        datetime(b.check_out) AS check_out,
        b.status,
        r.room_number
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.status IN ('Confirmed', 'Checked-in')
      ORDER BY b.check_in ASC
    `;
    const rows = await allQuery(query);
    res.json(rows);
  } catch (err) {
    console.error("Calendar fetch error:", err);
    res.status(500).json({ error: "Failed to load calendar bookings" });
  }
});

// GET - ALL BOOKINGS
router.get("/", requireAuth, (req, res) => {
  const query = `
    SELECT
      b.id,
      b.booking_id,
      b.check_in,
      b.check_out,
      b.status,
      b.price,
      b.advance_paid,
      b.add_ons,
      b.people_count,
      b.created_by_id,
      b.created_by_name,
      b.created_by_role,
      c.name    AS customer_name,
      c.contact AS customer_contact,
      r.room_number,
      r.category AS room_category
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    ORDER BY b.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Get bookings error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST - CREATE BOOKING
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      booking_id,
      customer_id,
      room_id,
      check_in,
      check_out,
      status,
      add_ons,
    } = req.body;

    // ✅ Sanitize numeric fields — coerce to numbers regardless of what frontend sends
    const price        = Number(req.body.price)        || 0;
    const advance_paid = Number(req.body.advance_paid) || 0;
    const people_count = Number(req.body.people_count) || 1;

    // ── Validation: check required fields FIRST before any DB calls ────────
    const missing = [];
    if (!booking_id)  missing.push("booking_id");
    if (!customer_id) missing.push("customer_id");
    if (!room_id)     missing.push("room_id");
    if (!price)       missing.push("price");

    if (missing.length > 0) {
      console.warn("❌ Missing fields:", missing);
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(", ")}`,
        missing,
      });
    }

    if (check_out && new Date(check_out) <= new Date(check_in)) {
      return res.status(400).json({
        error: "Check-out must be after check-in",
      });
    }

    // ── Get creator info from JWT ──────────────────────────────────────────
    const created_by_id   = req.user.id;
    const created_by_role = req.user.role;
    let   created_by_name = null;

    if (created_by_role === "admin") {
      const admin = await getQuery("SELECT name FROM users WHERE id = ?", [created_by_id]);
      created_by_name = admin?.name || "Admin";
    }

    if (created_by_role === "staff") {
      const staff = await getQuery(
        "SELECT s.name FROM users u JOIN staff s ON u.staff_id = s.id WHERE u.id = ?",
        [created_by_id]
      );
      created_by_name = staff?.name || "Staff";
    }

    console.log("📝 Creating booking by:", { created_by_id, created_by_name, created_by_role });

    // ── Date strings ───────────────────────────────────────────────────────
    const checkInStr  = check_in  || new Date().toISOString().slice(0, 19);
    const checkOutStr = check_out || null;

    // ── Room existence check ───────────────────────────────────────────────
    const room = await getQuery("SELECT id, capacity FROM rooms WHERE id = ?", [room_id]);
    if (!room) {
      return res.status(400).json({ error: "Invalid room selected" });
    }

    // ── Availability conflict check ────────────────────────────────────────
    const availability = await getQuery(
      `SELECT COUNT(*) as conflictCount
       FROM bookings
       WHERE room_id = ?
         AND status IN ('Confirmed', 'Checked-in')
         AND check_in  < ?
         AND (check_out IS NULL OR check_out > ?)`,
      [room_id, checkOutStr || checkInStr, checkInStr]
    );

    if (availability.conflictCount > 0) {
      return res.status(409).json({
        error: `Room is not available between ${checkInStr} and ${checkOutStr}`,
      });
    }

    // ── Insert booking ─────────────────────────────────────────────────────
    const bookingStatus = status || "Confirmed";

    const result = await runQuery(
      `INSERT INTO bookings
         (booking_id, customer_id, room_id, check_in, check_out, status,
          price, add_ons, people_count, advance_paid,
          created_by_id, created_by_name, created_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking_id,
        Number(customer_id),
        Number(room_id),
        checkInStr,
        checkOutStr,
        bookingStatus,
        price,
        JSON.stringify(add_ons || []),
        people_count,
        advance_paid,
        created_by_id,
        created_by_name,
        created_by_role,
      ]
    );

    // ── Update room status ─────────────────────────────────────────────────
    const roomStatus = bookingStatus === "Checked-in" ? "Occupied" : "Booked";
    await runQuery("UPDATE rooms SET status = ? WHERE id = ?", [roomStatus, room_id]);

    console.log("✅ Booking created:", booking_id, "by", created_by_name);

    res.status(201).json({
      id: result.lastID,
      booking_id,
      created_by_name,
      created_by_role,
      message: "Booking created and room status updated",
    });
  } catch (err) {
    console.error("Create booking error:", err.message);
    res.status(500).json({ error: "Create booking failed: " + err.message });
  }
});

// POST - CHECKOUT
router.post("/:id/checkout", requireAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const checkoutService = require("../services/checkoutService");

    console.log(`Processing checkout for booking ${bookingId}`);

    const result = await checkoutService.processCheckout(bookingId, req.body, req.user);

    if (!result.success) {
      return res.status(result.error.includes("Duplicate") ? 409 : 400).json({
        error: result.error,
        idempotency_key: result.idempotency_key,
      });
    }

    res.json({
      success: true,
      message: "Checkout completed successfully",
      billing_id: result.billing_id,
      idempotency_key: result.idempotency_key,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Checkout processing failed:", error);
    res.status(500).json({
      error: "Checkout failed: " + error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// GET - BOOKING BY ID
router.get("/:id", requireAuth, (req, res) => {
  const query = `
    SELECT
      b.id,
      b.booking_id,
      b.check_in,
      b.check_out,
      b.status,
      b.price,
      b.advance_paid,
      b.add_ons,
      b.created_by_id,
      b.created_by_name,
      b.created_by_role,
      c.name    AS customer_name,
      c.contact AS customer_contact,
      r.room_number,
      r.category AS room_category
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `;
  db.get(query, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Booking not found" });
    res.json(row);
  });
});

// PUT - UPDATE BOOKING STATUS
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "status field is required" });
    }

    const roomStatus =
      status === "Checked-in"  ? "Occupied"  :
      status === "Checked-out" ? "Available" :
      status === "Confirmed"   ? "Booked"    : "Available";

    await runQuery("UPDATE bookings SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);

    const row = await getQuery("SELECT room_id FROM bookings WHERE id = ?", [
      req.params.id,
    ]);
    if (!row) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await runQuery("UPDATE rooms SET status = ? WHERE id = ?", [
      roomStatus,
      row.room_id,
    ]);

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Update booking error:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE - BOOKING
router.delete("/:id", requireAuth, (req, res) => {
  db.run("DELETE FROM bookings WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Booking deleted" });
  });
});

module.exports = router;