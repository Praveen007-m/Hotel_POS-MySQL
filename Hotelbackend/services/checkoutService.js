const { v4: uuidv4 } = require('uuid');
const dbService = require('./dbService');
const { DEFAULT_GST_RATES } = require('../utils/billingUtils');

/**
 * Production Checkout Service with idempotency & line items
 */
class CheckoutService {
  /**
   * Process checkout with idempotency protection
   */
  async processCheckout(bookingId, checkoutData, user) {
    const { idempotency_key, gst_number, add_ons = [] } = checkoutData;
    
    // 1. Generate/validate idempotency key
    const key = idempotency_key || uuidv4();
    if (await dbService.idempotencyExists(key)) {
      return { success: false, error: 'Duplicate checkout attempt blocked', idempotency_key: key };
    }

    try {
      // 2. Get booking details
      const booking = await dbService.getBookingWithDetails(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'Checked-out') {
        throw new Error('Booking already checked out');
      }

      // 3. Validate totals
      const expectedTotal = booking.grandTotal;
      const providedTotal = Number(checkoutData.total_amount);
      if (Math.abs(expectedTotal - providedTotal) > 0.01) {
        throw new Error(`Total mismatch: expected ${expectedTotal}, got ${providedTotal}`);
      }

      // 4. Process with transaction
      const billingId = await dbService.transaction(async () => {
        // Update booking status
        await dbService.run(
          "UPDATE bookings SET status = 'Checked-out', check_out = ? WHERE id = ? AND status != 'Checked-out'",
          [new Date().toISOString(), bookingId]
        );

        // Free room
        await dbService.run("UPDATE rooms SET status = 'Available' WHERE id = ?", [booking.room_id]);

        // Settle kitchen orders
        await dbService.run(
          "UPDATE kitchen_orders SET status = 'Settled' WHERE booking_id = (SELECT booking_id FROM bookings WHERE id = ?)",
          [bookingId]
        );

        // Create billing record
        const billingResult = await dbService.run(
          `INSERT INTO billings (
            booking_id, idempotency_key, customer_id, room_id, check_in, check_out,
            advance_paid, total_amount, gst_number, billed_by_id, billed_by_name, billed_by_role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            booking.booking_id,
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
            user.role
          ]
        );

        // Create line items
        await this._createLineItems(billingResult.lastID, booking);

        // Save custom addons
        for (const addon of add_ons) {
          await dbService.run(
            'INSERT INTO booking_addons (booking_id, name, price) VALUES (?, ?, ?)',
            [bookingId, addon.name || 'Custom Add-on', Number(addon.price || 0)]
          );
        }

        return billingResult.lastID;
      });

      return {
        success: true,
        billing_id: billingId,
        idempotency_key: key,
        summary: {
          booking_id: booking.booking_id,
          total_amount: expectedTotal,
          balance: expectedTotal - (booking.advance_paid || 0)
        }
      };

    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }

  /**
   * Create invoice line items for billing
   */
  async _createLineItems(billingId, booking) {
    const lines = [];

    // Room charge
    lines.push({
      billing_id: billingId,
      type: 'room',
      description: `Room ${booking.room_number} (${booking.category})`,
      quantity: 1,
      unit_price: Number(booking.price),
      subtotal: Number(booking.price),
      gst_rate: this._getGstRate('room', booking.price),
      total: Number(booking.price)
    });

    // Kitchen items (aggregated)
    const kitchenItems = await dbService.all(
      `SELECT mi.name, SUM(ko.quantity) as qty, mi.price
       FROM kitchen_orders ko 
       JOIN menu_items mi ON ko.item_id = mi.id
       WHERE ko.booking_id = ?
       GROUP BY mi.id`,
      [booking.booking_id]
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
        total: subtotal
      });
    }

    // Addons from booking_addons
    const addons = await dbService.all('SELECT name, price FROM booking_addons WHERE booking_id = ?', [booking.id]);
    for (const addon of addons) {
      lines.push({
        billing_id: billingId,
        type: 'addon',
        description: addon.name,
        quantity: 1,
        unit_price: Number(addon.price),
        subtotal: Number(addon.price),
        gst_rate: DEFAULT_GST_RATES.addon,
        total: Number(addon.price)
      });
    }

    // Insert all line items
    for (const line of lines) {
      await dbService.run(
        `INSERT INTO invoices (billing_id, type, description, quantity, unit_price, subtotal, gst_rate, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [line.billing_id, line.type, line.description, line.quantity, line.unit_price,
         line.subtotal, line.gst_rate, line.total]
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

