const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");
const moment = require("moment-timezone");

// DEBUG - CHECK ROOM BY ID
router.get("/debug/room/:roomId", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, room_number, category, status, price_per_night, capacity FROM rooms WHERE id = ?",
      [req.params.roomId]
    );
    const room = rows[0];

    res.json({
      requested_room_id: req.params.roomId,
      found: Boolean(room),
      room: room || null,
    });
  } catch (err) {
    console.error("Debug room lookup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET - BOOKINGS FOR CALENDAR VIEW
router.get("/calendar", requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT
        b.id,
        b.booking_id,
        b.room_id,
        b.check_in AS check_in,
        b.check_out AS check_out,
        b.status,
        r.room_number
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.status IN ('Confirmed', 'Checked-in')
      ORDER BY b.check_in ASC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Calendar fetch error:", err);
    res.status(500).json({ error: "Failed to load calendar bookings" });
  }
});

// GET - ALL BOOKINGS
router.get("/", requireAuth, async (req, res) => {
  try {
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
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ error: err.message });
  }
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

    const price = Number(req.body.price) || 0;
    const advance_paid = Number(req.body.advance_paid) || 0;
    const people_count = Number(req.body.people_count) || 1;

    const missing = [];
    if (!booking_id) missing.push("booking_id");
    if (!customer_id) missing.push("customer_id");
    if (!room_id) missing.push("room_id");
    if (!price) missing.push("price");

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(", ")}`,
        missing,
      });
    }

    if (
      check_out &&
      moment(check_out).isSameOrBefore(moment(check_in))
    ) {
      return res.status(400).json({ error: "Check-out must be after check-in" });
    }

    const created_by_id = req.user.id;
    const created_by_role = req.user.role;
    let created_by_name = null;

    if (created_by_role === "admin") {
      const [adminRows] = await db.query("SELECT name FROM users WHERE id = ?", [created_by_id]);
      created_by_name = adminRows[0]?.name || "Admin";
    }

    if (created_by_role === "staff") {
      const [staffRows] = await db.query(
        "SELECT s.name FROM users u JOIN staff s ON u.staff_id = s.id WHERE u.id = ?",
        [created_by_id]
      );
      created_by_name = staffRows[0]?.name || "Staff";
    }

    const checkInStr = check_in
      ? moment.tz(check_in, "Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
      : moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const checkOutStr = check_out
      ? moment.tz(check_out, "Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
      : null;

    const [roomRows] = await db.query("SELECT id, capacity FROM rooms WHERE id = ?", [room_id]);
    const room = roomRows[0];
    if (!room) {
      return res.status(400).json({ error: "Invalid room selected" });
    }

    const [availabilityRows] = await db.query(
      `SELECT COUNT(*) as conflictCount
       FROM bookings
       WHERE room_id = ?
         AND status IN ('Confirmed', 'Checked-in')
         AND check_in < ?
         AND (check_out IS NULL OR check_out > ?)`,
      [room_id, checkOutStr || checkInStr, checkInStr]
    );

    const conflictCount = availabilityRows[0]?.conflictCount || 0;
    if (conflictCount > 0) {
      return res.status(409).json({ error: `Room is not available between ${checkInStr} and ${checkOutStr}` });
    }

    const bookingStatus = status || "Confirmed";

    const [insertResult] = await db.query(
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

    const roomStatus = bookingStatus === "Checked-in" ? "Occupied" : "Booked";
    await db.query("UPDATE rooms SET status = ? WHERE id = ?", [roomStatus, room_id]);

    res.status(201).json({
      id: insertResult.insertId,
      booking_id,
      created_by_name,
      created_by_role,
      message: "Booking created and room status updated",
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Create booking failed: " + err.message });
  }
});

// POST - CHECKOUT
router.post("/:id/checkout", requireAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const checkoutService = require("../services/checkoutService");

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
router.get("/:id", requireAuth, async (req, res) => {
  try {
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
    const [rows] = await db.query(query, [req.params.id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Booking not found" });
    res.json(row);
  } catch (err) {
    console.error("Get booking by ID error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - UPDATE BOOKING STATUS
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "status field is required" });
    }

    const roomStatus =
      status === "Checked-in"
        ? "Occupied"
        : status === "Checked-out"
        ? "Available"
        : status === "Confirmed"
        ? "Booked"
        : "Available";

    const [updateBookings] = await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
    if (updateBookings.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const [rowResult] = await db.query("SELECT room_id FROM bookings WHERE id = ?", [req.params.id]);
    const row = rowResult[0];
    if (!row) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await db.query("UPDATE rooms SET status = ? WHERE id = ?", [roomStatus, row.room_id]);

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Update booking error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE - BOOKING
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM bookings WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
