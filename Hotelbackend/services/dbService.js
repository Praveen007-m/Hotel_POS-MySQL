const db = require('../db/database');

/**
 * Production-ready DB service with transactions and common queries
 */
class DbService {
  constructor() {
    this.db = db;
  }

  /**
   * Execute query with transaction safety
   */
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Get single row
   */
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get all rows
   */
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Execute block with transaction
   * @param {Function} fn - Async function to execute
   */
  async transaction(fn) {
    await this.run('BEGIN');
    try {
      const result = await fn();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      console.error('Transaction rolled back:', error);
      throw error;
    }
  }

  /**
   * Check if idempotency key exists
   */
  async idempotencyExists(key) {
    const row = await this.get('SELECT id FROM billings WHERE idempotency_key = ?', [key]);
    return !!row;
  }

  /**
   * Get booking with addons and kitchen totals
   */
  async getBookingWithDetails(bookingId) {
    const booking = await this.get(
      `SELECT b.*, c.name as customer_name, r.room_number, r.category
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) return null;

    // Get addons total
    const addons = await this.all(
      'SELECT name, price FROM booking_addons WHERE booking_id = ?',
      [bookingId]
    );
    const addonsTotal = addons.reduce((sum, a) => sum + Number(a.price || 0), 0);

    // Get kitchen total
    const kitchen = await this.all(
      `SELECT SUM(mi.price * ko.quantity) as kitchen_total
       FROM kitchen_orders ko
       JOIN menu_items mi ON ko.item_id = mi.id
       WHERE ko.booking_id = (SELECT booking_id FROM bookings WHERE id = ?) 
       AND ko.status IN ('Pending', 'Served')`,
      [bookingId]
    );
    const kitchenTotal = Number(kitchen[0]?.kitchen_total || 0);

    return {
      ...booking,
      addons,
      addonsTotal,
      kitchenTotal,
      grandTotal: Number(booking.price || 0) + addonsTotal + kitchenTotal
    };
  }
}

module.exports = new DbService();

