const db = require("../db/database");

/**
 * Production-ready DB service (MySQL compatible)
 */
class DbService {
  constructor() {
    this.db = db;
  }

  /**
   * Execute INSERT/UPDATE/DELETE
   */
  async run(sql, params = []) {
    try {
      const result = await this.db.run(sql, params);
      // result already contains { lastID, changes }
      return result;
    } catch (err) {
      console.error("DB RUN Error:", err);
      throw err;
    }
  }

  /**
   * Get single row
   */
  async get(sql, params = []) {
    try {
      const row = await new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      return row;
    } catch (err) {
      console.error("DB GET Error:", err);
      throw err;
    }
  }

  /**
   * Get multiple rows
   */
  async all(sql, params = []) {
    try {
      const rows = await new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      return rows;
    } catch (err) {
      console.error("DB ALL Error:", err);
      throw err;
    }
  }

  /**
   * Execute transaction (MySQL-safe)
   */
  async transaction(fn) {
    await this.run("START TRANSACTION"); // ✅ MySQL syntax
    try {
      const result = await fn();
      await this.run("COMMIT");
      return result;
    } catch (error) {
      await this.run("ROLLBACK");
      console.error("Transaction rolled back:", error);
      throw error;
    }
  }

  /**
   * Check idempotency key
   */
  async idempotencyExists(key) {
    const row = await this.get(
      "SELECT id FROM billings WHERE idempotency_key = ?",
      [key]
    );
    return !!row;
  }

  /**
   * Get booking with full details
   */
  async getBookingWithDetails(bookingId) {
    const booking = await this.get(
      `SELECT b.*, c.name AS customer_name, r.room_number, r.category
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) return null;

    // Add-ons
    const addons = await this.all(
      "SELECT name, price FROM booking_addons WHERE booking_id = ?",
      [booking.booking_id]
    );

    const addonsTotal = addons.reduce(
      (sum, a) => sum + Number(a.price || 0),
      0
    );

    // Kitchen total - ONLY 'served' status (already settled/finalized)
    const kitchenRows = await this.all(
      `SELECT SUM(mi.price * ko.quantity) AS kitchen_total
       FROM kitchen_orders ko
       JOIN menu_items mi ON ko.item_id = mi.id
       WHERE ko.booking_id = ?
       AND ko.status = 'Served'`,
      [booking.booking_id]
    );

    const kitchenTotal = Number(kitchenRows[0]?.kitchen_total || 0);

    return {
      ...booking,
      addons,
      addonsTotal,
      kitchenTotal,
      grandTotal:
        Number(booking.price || 0) + addonsTotal + kitchenTotal,
    };
  }

  /**
   * Get kitchen orders for a booking (only 'served' status)
   */
  async getKitchenOrdersForBilling(bookingId) {
    return await this.all(
      `SELECT 
        ko.id,
        ko.quantity,
        mi.name as item_name,
        mi.price as item_price,
        (mi.price * ko.quantity) AS total
       FROM kitchen_orders ko
       JOIN menu_items mi ON ko.item_id = mi.id
       WHERE ko.booking_id = ?
       AND ko.status = 'Served'
       ORDER BY ko.created_at ASC`,
      [bookingId]
    );
  }
}

module.exports = new DbService();
