const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const runQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const getQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const allQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const resolveRoom = async (roomIdInput) => {
  const numericRoomId = Number(roomIdInput);

  if (Number.isInteger(numericRoomId) && numericRoomId > 0) {
    const roomById = await getQuery(
      "SELECT id, room_number, capacity FROM rooms WHERE id = ?",
      [numericRoomId]
    );
    if (roomById) return roomById;
  }

  const roomNumberCandidate = String(roomIdInput || "").trim();
  if (!roomNumberCandidate) return null;

  return getQuery(
    "SELECT id, room_number, capacity FROM rooms WHERE room_number = ?",
    [roomNumberCandidate]
  );
};

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
      console.error("Get bookings error:", {
        message: err.message,
        code: err.code,
        query,
      });
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

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
      console.warn("Booking validation failed:", {
        missing,
        booking_id,
        customer_id,
        room_id,
        rawPrice: req.body.price,
      });
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

    const created_by_id = req.user.id;
    const created_by_role = req.user.role;
    let created_by_name = null;

    if (created_by_role === "admin") {
      const admin = await getQuery("SELECT name FROM users WHERE id = ?", [
        created_by_id,
      ]);
      created_by_name = admin?.name || "Admin";
    }

    if (created_by_role === "staff") {
      const staff = await getQuery(
        "SELECT s.name FROM users u JOIN staff s ON u.staff_id = s.id WHERE u.id = ?",
        [created_by_id]
      );
      created_by_name = staff?.name || "Staff";
    }

    console.log("Creating booking by:", {
      created_by_id,
      created_by_name,
      created_by_role,
    });

    const checkInStr = check_in || new Date().toISOString().slice(0, 19);
    const checkOutStr = check_out || null;

    const room = await resolveRoom(room_id);
    if (!room) {
      console.warn("Booking rejected because room was not found:", {
        room_id,
        booking_id,
        customer_id,
      });
      return res.status(400).json({ error: "Invalid room selected" });
    }

    const resolvedRoomId = Number(room.id);

    const customer = await getQuery("SELECT id FROM customers WHERE id = ?", [
      Number(customer_id),
    ]);
    if (!customer) {
      console.warn("Booking rejected because customer was not found:", {
        room_id: resolvedRoomId,
        booking_id,
        customer_id,
      });
      return res.status(400).json({ error: "Invalid customer selected" });
    }

    const availability = await getQuery(
      `SELECT COUNT(*) as conflictCount
       FROM bookings
       WHERE room_id = ?
         AND status IN ('Confirmed', 'Checked-in')
         AND check_in < ?
         AND (check_out IS NULL OR check_out > ?)`,
      [resolvedRoomId, checkOutStr || checkInStr, checkInStr]
    );

    if (availability.conflictCount > 0) {
      return res.status(409).json({
        error: `Room is not available between ${checkInStr} and ${checkOutStr}`,
      });
    }

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
        resolvedRoomId,
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
    await runQuery("UPDATE rooms SET status = ? WHERE id = ?", [
      roomStatus,
      resolvedRoomId,
    ]);

    console.log("✅ Booking created:", booking_id, "by", created_by_name);

    res.status(201).json({
      id: result.lastID,
      booking_id,
      created_by_name,
      created_by_role,
      message: "Booking created and room status updated",
    });
  } catch (err) {
    console.error("Create booking error:", {
      message: err.message,
      code: err.code,
      body: req.body,
      user: req.user,
    });
    res.status(500).json({ error: "Create booking failed: " + err.message });
  }
});

router.post("/:id/checkout", requireAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const checkoutService = require("../services/checkoutService");

    console.log(`Processing checkout for booking ${bookingId}`);

    const result = await checkoutService.processCheckout(
      bookingId,
      req.body,
      req.user
    );

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

router.delete("/:id", requireAuth, (req, res) => {
  db.run("DELETE FROM bookings WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Booking deleted" });
  });
});

module.exports = router;
