const { v4: uuidv4 } = require("uuid");
const dbService = require("./dbService");
const { DEFAULT_GST_RATES } = require("../utils/billingUtils");

class CheckoutService {
  async processCheckout(bookingId, checkoutData, user) {
    const { idempotency_key, gst_number, add_ons = [] } = checkoutData;

    const key = idempotency_key || uuidv4();

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

      const checkInDate = new Date(booking.check_in);
      const checkOutDate = new Date(booking.check_out);

      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);

      const stayDays = Math.max(
        Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
        1
      );

      const roomTotal = Number(booking.price || 0) * stayDays;
      const kitchenTotal = Number(booking.kitchenTotal || 0);

      const dbAddons = await dbService.getBookingAddons(booking.booking_id);
      const dbAddonTotal = dbAddons.reduce(
        (sum, addon) => sum + Number(addon.price || 0),
        0
      );

      const existingAddonCounts = dbAddons.reduce((counts, addon) => {
        const key = `${addon.name || ""}::${Number(addon.price || 0)}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});

      const newAddOns = add_ons.filter((addon) => {
        const key = `${addon.name || ""}::${Number(addon.price || 0)}`;
        if (existingAddonCounts[key] > 0) {
          existingAddonCounts[key] -= 1;
          return false;
        }
        return true;
      });

      const newAddonTotal = newAddOns.reduce(
        (sum, addon) => sum + Number(addon.price || 0),
        0
      );

      const addonTotal = dbAddonTotal + newAddonTotal;
      const expectedTotal = roomTotal + kitchenTotal + addonTotal;
      const advancePaid = Number(booking.advance_paid || 0);
      const balanceAmount = expectedTotal - advancePaid;
      const providedTotal = Number(checkoutData.total_amount || 0);

      console.log("Checkout Debug:", {
        stayDays,
        roomTotal,
        kitchenTotal,
        dbAddonTotal,
        newAddonTotal,
        addonTotal,
        expectedTotal,
        providedTotal,
      });

      if (Math.abs(expectedTotal - providedTotal) > 1) {
        console.warn(
          `Total mismatch (IGNORED): expected ${expectedTotal}, got ${providedTotal}`
        );
      }

      const billingId = await dbService.transaction(async () => {
        for (const addon of newAddOns) {
          await dbService.run(
            `INSERT INTO booking_addons (booking_id, name, price)
             VALUES (?, ?, ?)`,
            [
              booking.booking_id,
              addon.name || "Custom Add-on",
              Number(addon.price || 0),
            ]
          );
        }

        await dbService.run(
          `UPDATE bookings
           SET status = 'Checked-out', check_out = NOW()
           WHERE id = ?`,
          [bookingId]
        );

        await dbService.run(
          `UPDATE rooms SET status = 'Available' WHERE id = ?`,
          [booking.room_id]
        );

        const billingResult = await dbService.run(
          `INSERT INTO billings (
            booking_id, idempotency_key, customer_id, room_id,
            check_in, check_out, advance_paid, total_amount,
            gst_number, billed_by_id, billed_by_name, billed_by_role
          ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
          [
            booking.booking_id,
            key,
            booking.customer_id,
            booking.room_id,
            booking.check_in,
            advancePaid,
            expectedTotal,
            gst_number || null,
            user.id,
            user.name,
            user.role,
          ]
        );

        await this._createLineItems(billingResult.lastID, booking, stayDays);

        return billingResult.lastID;
      });

      return {
        success: true,
        billing_id: billingId,
        idempotency_key: key,
        summary: {
          booking_id: booking.booking_id,
          roomTotal,
          kitchenTotal,
          addonTotal,
          total_amount: expectedTotal,
          totalAmount: expectedTotal,
          advancePaid,
          balance: balanceAmount,
          balanceAmount,
        },
      };
    } catch (error) {
      console.error("Checkout failed:", error);
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
      description: `Room ${booking.room_number} (${booking.category}) x ${stayDays} night`,
      quantity: stayDays,
      unit_price: roomUnitPrice,
      subtotal: roomSubtotal,
      gst_rate: this._getGstRate("room", roomUnitPrice),
      total: roomSubtotal,
    });

    const kitchenOrders = await dbService.getKitchenOrdersForInvoice(booking.booking_id);

    for (const kitchenOrder of kitchenOrders) {
      const quantity = Number(kitchenOrder.quantity || 1);
      const lineTotal = Number(kitchenOrder.total || 0);
      const unitPrice = quantity > 0 ? lineTotal / quantity : lineTotal;

      lines.push({
        billing_id: billingId,
        type: "kitchen",
        description: kitchenOrder.item_name,
        quantity,
        unit_price: unitPrice,
        subtotal: lineTotal,
        gst_rate: DEFAULT_GST_RATES.addon,
        total: lineTotal,
      });
    }

    const addons = await dbService.getBookingAddons(booking.booking_id);

    for (const addon of addons) {
      lines.push({
        billing_id: billingId,
        type: "addon",
        description: addon.name,
        quantity: 1,
        unit_price: Number(addon.price || 0),
        subtotal: Number(addon.price || 0),
        gst_rate: DEFAULT_GST_RATES.addon,
        total: Number(addon.price || 0),
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
