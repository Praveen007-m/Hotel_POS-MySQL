const { v4: uuidv4 } = require('uuid');
const dbService = require('./dbService');
const { DEFAULT_GST_RATES } = require('../utils/billingUtils');

class CheckoutService {
  async processCheckout(bookingId, checkoutData, user) {
    const { idempotency_key, gst_number, add_ons = [] } = checkoutData;

    const key = idempotency_key || uuidv4();

    // Prevent duplicate checkout
    if (await dbService.idempotencyExists(key)) {
      return {
        success: false,
        error: 'Duplicate checkout attempt blocked',
        idempotency_key: key,
      };
    }

    try {
      const booking = await dbService.getBookingWithDetails(bookingId);

      if (!booking) throw new Error('Booking not found');
      if (booking.status === 'Checked-out') {
        throw new Error('Booking already checked out');
      }

      // ================= TOTAL CALCULATION =================

      const roomTotal = Number(booking.price || 0);

      // Kitchen total
      const kitchenResult = await dbService.all(
        `SELECT SUM(ko.quantity * mi.price) as total
         FROM kitchen_orders ko
         JOIN menu_items mi ON ko.item_id = mi.id
         WHERE ko.booking_id = ?`,
        [booking.id]
      );

      const kitchenTotal = Number(kitchenResult[0]?.total || 0);

      // Existing DB addons
      const dbAddons = await dbService.all(
        `SELECT price FROM booking_addons WHERE booking_id = ?`,
        [booking.id]
      );

      const dbAddonTotal = dbAddons.reduce(
        (sum, a) => sum + Number(a.price || 0),
        0
      );

      // New addons (from frontend)
      const newAddonTotal = add_ons.reduce(
        (sum, a) => sum + Number(a.price || 0),
        0
      );

      const expectedTotal =
        roomTotal + kitchenTotal + dbAddonTotal + newAddonTotal;

      const providedTotal = Number(checkoutData.total_amount);

      console.log({
        roomTotal,
        kitchenTotal,
        dbAddonTotal,
        newAddonTotal,
        expectedTotal,
        providedTotal,
      });

      if (Math.abs(expectedTotal - providedTotal) > 0.01) {
        throw new Error(
          `Total mismatch: expected ${expectedTotal}, got ${providedTotal}`
        );
      }

      // ================= TRANSACTION =================

      const billingId = await dbService.transaction(async () => {
        // ✅ Save addons FIRST (IMPORTANT FIX)
        for (const addon of add_ons) {
          await dbService.run(
            `INSERT INTO booking_addons (booking_id, name, price)
             VALUES (?, ?, ?)`,
            [
              bookingId,
              addon.name || 'Custom Add-on',
              Number(addon.price || 0),
            ]
          );
        }

        // Update booking
        await dbService.run(
          `UPDATE bookings 
           SET status = 'Checked-out', check_out = ?
           WHERE id = ? AND status != 'Checked-out'`,
          [new Date().toISOString(), bookingId]
        );

        // Free room
        await dbService.run(
          `UPDATE rooms SET status = 'Available' WHERE id = ?`,
          [booking.room_id]
        );

        // Settle kitchen
        await dbService.run(
          `UPDATE kitchen_orders SET status = 'Settled'
           WHERE booking_id = ?`,
          [bookingId]
        );

        // Create billing
        const billingResult = await dbService.run(
          `INSERT INTO billings (
            booking_id, idempotency_key, customer_id, room_id,
            check_in, check_out, advance_paid, total_amount,
            gst_number, billed_by_id, billed_by_name, billed_by_role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            booking.id,
            key,
            booking.customer_id,
            booking.room_id,
            booking.check_in,
            new Date().toISOString(),
            booking.advance_paid || 0,
            expectedTotal,
            gst_number || null,
            user.id,
            user.name,
            user.role,
          ]
        );

        // Create invoice items AFTER addons saved
        await this._createLineItems(billingResult.lastID, booking);

        return billingResult.lastID;
      });

      return {
        success: true,
        billing_id: billingId,
        idempotency_key: key,
        summary: {
          booking_id: booking.id,
          total_amount: expectedTotal,
          balance: expectedTotal - (booking.advance_paid || 0),
        },
      };
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }

  async _createLineItems(billingId, booking) {
    const lines = [];

    // Room
    lines.push({
      billing_id: billingId,
      type: 'room',
      description: `Room ${booking.room_number} (${booking.category})`,
      quantity: 1,
      unit_price: Number(booking.price),
      subtotal: Number(booking.price),
      gst_rate: this._getGstRate('room', booking.price),
      total: Number(booking.price),
    });

    // Kitchen
    const kitchenItems = await dbService.all(
      `SELECT mi.name, SUM(ko.quantity) as qty, mi.price
       FROM kitchen_orders ko
       JOIN menu_items mi ON ko.item_id = mi.id
       WHERE ko.booking_id = ?
       GROUP BY mi.id`,
      [booking.id]
    );

    for (const item of kitchenItems) {
      const subtotal = Number(item.qty) * Number(item.price);

      lines.push({
        billing_id: billingId,
        type: 'kitchen',
        description: item.name,
        quantity: Number(item.qty),
        unit_price: Number(item.price),
        subtotal,
        gst_rate: DEFAULT_GST_RATES.kitchen,
        total: subtotal,
      });
    }

    // Addons
    const addons = await dbService.all(
      `SELECT name, price FROM booking_addons WHERE booking_id = ?`,
      [booking.id]
    );

    for (const addon of addons) {
      lines.push({
        billing_id: billingId,
        type: 'addon',
        description: addon.name,
        quantity: 1,
        unit_price: Number(addon.price),
        subtotal: Number(addon.price),
        gst_rate: DEFAULT_GST_RATES.addon,
        total: Number(addon.price),
      });
    }

    // Insert lines
    for (const line of lines) {
      await dbService.run(
        `INSERT INTO invoices (
          billing_id, type, description, quantity,
          unit_price, subtotal, gst_rate, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          line.billing_id,
          line.type,
          line.description,
          line.quantity,
          line.unit_price,
          line.subtotal,
          line.gst_rate,
          line.total,
        ]
      );
    }
  }

  _getGstRate(type, amount) {
    if (type === 'room' && amount > DEFAULT_GST_RATES.room.threshold) {
      return DEFAULT_GST_RATES.room.high;
    }
    const rates = DEFAULT_GST_RATES[type];
    return typeof rates === 'object' ? rates.low : rates || 0;
  }
}

module.exports = new CheckoutService();