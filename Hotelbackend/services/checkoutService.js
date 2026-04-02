const { v4: uuidv4 } = require("uuid");
const dbService = require("./dbService");
const { DEFAULT_GST_RATES } = require("../utils/billingUtils");

class CheckoutService {
  async processCheckout(bookingId, checkoutData, user) {
    const { idempotency_key, gst_number, add_ons = [] } = checkoutData;

    const key = idempotency_key || uuidv4();

    // ✅ Prevent duplicate checkout
    if (await dbService.idempotencyExists(key)) {
      return {
        success: false,
        error: "Duplicate checkout attempt blocked",
        idempotency_key: key,
      };
    }

    try {
      const booking = await dbService.getBookingWithDetails(bookingId);

      if (!booking) throw new Error("Booking not found");
      if (booking.status === "Checked-out") {
        throw new Error("Booking already checked out");
      }

      // ================= TOTAL CALCULATION =================

      const checkInDate = new Date(booking.check_in);
      const checkOutDate = new Date(booking.check_out);

      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);

      const stayDays = Math.max(
        Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
        1
      );

      const roomTotal = Number(booking.price || 0) * stayDays;

      // ✅ Kitchen (FIXED)
      const kitchenResult = await dbService.all(
        `SELECT SUM(ko.quantity * mi.price) as total
         FROM kitchen_orders ko
         JOIN menu_items mi ON ko.item_id = mi.id
         WHERE ko.booking_id = ?
         AND ko.status = 'Served'`,
        [booking.booking_id]
      );

      const kitchenTotal = Number(kitchenResult[0]?.total || 0);

      // ✅ Existing addons (FIXED)
      const dbAddons = await dbService.all(
        `SELECT price FROM booking_addons WHERE booking_id = ?`,
        [booking.booking_id]
      );

      const dbAddonTotal = dbAddons.reduce(
        (sum, a) => sum + Number(a.price || 0),
        0
      );

      // New addons
      const newAddonTotal = add_ons.reduce(
        (sum, a) => sum + Number(a.price || 0),
        0
      );

      const expectedTotal =
        roomTotal + kitchenTotal + dbAddonTotal + newAddonTotal;

      const providedTotal = Number(checkoutData.total_amount || 0);

      console.log("🧾 Checkout Debug:", {
        stayDays,
        roomTotal,
        kitchenTotal,
        dbAddonTotal,
        newAddonTotal,
        expectedTotal,
        providedTotal,
      });

      if (Math.abs(expectedTotal - providedTotal) > 1) {
        console.warn(
          `⚠️ Total mismatch (IGNORED): expected ${expectedTotal}, got ${providedTotal}`
        );
      }

      // ================= TRANSACTION =================

      const billingId = await dbService.transaction(async () => {
        // ✅ Save addons (FIXED)
        for (const addon of add_ons) {
          await dbService.run(
            `INSERT INTO booking_addons (booking_id, name, price)
             VALUES (?, ?, ?)`,
            [
              booking.booking_id, // ✅ FIXED
              addon.name || "Custom Add-on",
              Number(addon.price || 0),
            ]
          );
        }

        // Update booking
        await dbService.run(
          `UPDATE bookings 
           SET status = 'Checked-out', check_out = NOW()
           WHERE id = ?`,
          [bookingId]
        );

        // Free room
        await dbService.run(
          `UPDATE rooms SET status = 'Available' WHERE id = ?`,
          [booking.room_id]
        );

        // ✅ Create billing (already correct)
        const billingResult = await dbService.run(
          `INSERT INTO billings (
            booking_id, idempotency_key, customer_id, room_id,
            check_in, check_out, advance_paid, total_amount,
            gst_number, billed_by_id, billed_by_name, billed_by_role
          ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
          [
            booking.booking_id, // ✅ CORRECT
            key,
            booking.customer_id,
            booking.room_id,
            booking.check_in,
            booking.advance_paid || 0,
            expectedTotal,
            gst_number || null,
            user.id,
            user.name,
            user.role,
          ]
        );

        await this._createLineItems(
          billingResult.lastID,
          booking,
          stayDays
        );

        // ✅ Settle kitchen after line-item capture
        await dbService.run(
          `UPDATE kitchen_orders SET status = 'Settled'
           WHERE booking_id = ?
           AND status = 'Served'`,
          [booking.booking_id]
        );

        return billingResult.lastID;
      });

      return {
        success: true,
        billing_id: billingId,
        idempotency_key: key,
        summary: {
          booking_id: booking.booking_id, // ✅ FIXED
          total_amount: expectedTotal,
          balance: expectedTotal - (booking.advance_paid || 0),
        },
      };
    } catch (error) {
      console.error("❌ Checkout failed:", error);
      throw error;
    }
  }

  async _createLineItems(billingId, booking, stayDays = 1) {
    const lines = [];

    const roomUnitPrice = Number(booking.price || 0);
    const roomSubtotal = roomUnitPrice * stayDays;

    lines.push({
      billing_id: billingId,
      type: "room",
      description: `Room ${booking.room_number} (${booking.category}) × ${stayDays} night`,
      quantity: stayDays,
      unit_price: roomUnitPrice,
      subtotal: roomSubtotal,
      gst_rate: this._getGstRate("room", roomUnitPrice),
      total: roomSubtotal,
    });

    // ✅ FIXED addons fetch
    const addons = await dbService.all(
      `SELECT name, price FROM booking_addons WHERE booking_id = ?`,
      [booking.booking_id]
    );

    for (const addon of addons) {
      lines.push({
        billing_id: billingId,
        type: "addon",
        description: addon.name,
        quantity: 1,
        unit_price: Number(addon.price),
        subtotal: Number(addon.price),
        gst_rate: DEFAULT_GST_RATES.addon,
        total: Number(addon.price),
      });
    }

    // Kitchen (already correct)
    const kitchenOrders = await dbService.getKitchenOrdersForBilling(
      booking.booking_id
    );

    for (const order of kitchenOrders) {
      const itemTotal =
        Number(order.item_price || 0) * Number(order.quantity || 1);

      lines.push({
        billing_id: billingId,
        type: "kitchen",
        description: `${order.item_name} × ${order.quantity}`,
        quantity: order.quantity,
        unit_price: Number(order.item_price || 0),
        subtotal: itemTotal,
        gst_rate: DEFAULT_GST_RATES.kitchen,
        total: itemTotal,
      });
    }

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
    if (type === "room" && amount > DEFAULT_GST_RATES.room.threshold) {
      return DEFAULT_GST_RATES.room.high;
    }
    const rates = DEFAULT_GST_RATES[type];
    return typeof rates === "object" ? rates.low : rates || 0;
  }
}

module.exports = new CheckoutService();
