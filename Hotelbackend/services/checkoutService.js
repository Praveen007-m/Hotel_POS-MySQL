const { v4: uuidv4 } = require("uuid");
const dbService = require("./dbService");
const { DEFAULT_GST_RATES } = require("../utils/billingUtils");

// ─────────────────────────────────────────────────────────────
// DATETIME HELPERS  (pure string — zero new Date(string))
// ─────────────────────────────────────────────────────────────

/**
 * Extract the date portion "YYYY-MM-DD" from a MySQL DATETIME string.
 * Accepts "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm" or "YYYY-MM-DD".
 * Pure string — no Date() construction.
 */
const extractDatePart = (datetimeStr) => {
  if (!datetimeStr) return null;
  // MySQL serialises DATETIME as e.g. "2026-04-15T13:00:00.000Z" when the
  // mysql2 driver type-casts it to a JS Date.  We guard both formats:
  return String(datetimeStr).replace("T", " ").slice(0, 10); // "YYYY-MM-DD"
};

/**
 * Count the number of whole calendar days between two DATETIME strings.
 * We compare date parts only (ignoring time) to match hotel night-counting
 * convention: a guest checking in at 13:00 and out at 11:00 next day = 1 night.
 *
 * Steps (all pure arithmetic on numbers, no Date(string)):
 *   1. Parse "YYYY-MM-DD" into [year, month, day] integers.
 *   2. Compute a simple day-serial (Gregorian day number approximation).
 *   3. Return the difference, minimum 1.
 *
 * This is safe for all valid dates and handles month/year boundaries correctly.
 */
const daysBetween = (startDatetimeStr, endDatetimeStr) => {
  const startStr = extractDatePart(startDatetimeStr);
  const endStr   = extractDatePart(endDatetimeStr);

  if (!startStr || !endStr) return 1;

  const [sy, sm, sd] = startStr.split("-").map(Number);
  const [ey, em, ed] = endStr.split("-").map(Number);

  // Use Date(year, month-1, day) — constructed from NUMBERS, uses LOCAL time,
  // never parses a string, so no UTC/timezone interpretation occurs.
  const msPerDay = 1000 * 60 * 60 * 24;
  const startMs  = new Date(sy, sm - 1, sd).getTime();
  const endMs    = new Date(ey, em - 1, ed).getTime();

  return Math.max(Math.round((endMs - startMs) / msPerDay), 1);
};

/**
 * Return the current local datetime as "YYYY-MM-DD HH:mm:ss".
 */
// MODIFIED: Generate checkout timestamps in Node local time instead of MySQL server time.
const getLocalDateTime = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  );
};

// ─────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────

class CheckoutService {
  async processCheckout(bookingId, checkoutData, user) {
    const { idempotency_key, gst_number, add_ons = [], discount = 0 } = checkoutData;

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

      // ── Stay duration ────────────────────────────────────────
      // OLD (BROKEN): new Date(booking.check_in) → UTC parse → timezone shift
      //               then setHours(0,0,0,0) → further mutation
      // NEW (SAFE):   pure string arithmetic on date parts only
      const stayDays = daysBetween(booking.check_in, booking.check_out);

      const roomTotal    = Number(booking.price || 0) * stayDays;
      const kitchenTotal = Number(booking.kitchenTotal || 0);

      const dbAddons = await dbService.getBookingAddons(booking.booking_id);
      const dbAddonTotal = dbAddons.reduce(
        (sum, addon) => sum + Number(addon.price || 0),
        0
      );

      const existingAddonCounts = dbAddons.reduce((counts, addon) => {
        const k = `${addon.name || ""}::${Number(addon.price || 0)}`;
        counts[k] = (counts[k] || 0) + 1;
        return counts;
      }, {});

      const newAddOns = add_ons.filter((addon) => {
        const k = `${addon.name || ""}::${Number(addon.price || 0)}`;
        if (existingAddonCounts[k] > 0) {
          existingAddonCounts[k] -= 1;
          return false;
        }
        return true;
      });

      const newAddonTotal = newAddOns.reduce(
        (sum, addon) => sum + Number(addon.price || 0),
        0
      );

      const addonTotal    = dbAddonTotal + newAddonTotal;
      const discountToApply = Number(discount || booking.discount || 0);
      const advancePaid   = Number(booking.advance_paid || 0);

      const billingUtils = require("../utils/billingUtils");

      // 1. Calculate base subtotal
      const subtotalBase = roomTotal + kitchenTotal + addonTotal;

      // 2. Calculate GST totals
      const roomGstInfo = billingUtils.computeGST("room", roomTotal);
      const kitchenGstInfo = billingUtils.computeGST("kitchen", kitchenTotal);
      const addonGstInfo = billingUtils.computeGST("addon", addonTotal);

      const totalGst = roomGstInfo.gst_amount + kitchenGstInfo.gst_amount + addonGstInfo.gst_amount;

      // 3. Gross Total (Total + GST)
      const grossTotal = Number((subtotalBase + totalGst).toFixed(2));

      // 4. Final Balance (TotalWithGST - Discount - Advance)
      const afterDiscount = grossTotal - discountToApply;
      const finalAmount = Number((afterDiscount - advancePaid).toFixed(2));

      console.log("Checkout Calculation:", {
        stayDays,
        subtotalBase,
        totalGst,
        grossTotal,
        discountToApply,
        advancePaid,
        finalAmount
      });

      const expectedTotal = grossTotal; // Aligning with the new definition of "Total Amount"
      const balanceAmount = finalAmount;
      const providedTotal = Number(checkoutData.total_amount || 0);

      if (Math.abs(expectedTotal - providedTotal) > 1) {
        console.warn(
          `Total mismatch (IGNORED): expected ${expectedTotal}, got ${providedTotal}`
        );
      }

      // MODIFIED: Single checkout timestamp used for both bookings and billings.
      const finalCheckoutTime = checkoutData.check_out
        ? checkoutData.check_out
        : getLocalDateTime();

      const billingId = await dbService.transaction(async () => {
        for (const addon of newAddOns) {
          await dbService.run(
            `INSERT INTO booking_addons (booking_id, name, price) VALUES (?, ?, ?)`,
            [booking.booking_id, addon.name || "Custom Add-on", Number(addon.price || 0)]
          );
        }

        // MODIFIED: Always bind the final checkout time; never call MySQL time functions.
        await dbService.run(
          `UPDATE bookings SET status = 'Checked-out', check_out = ? WHERE id = ?`,
          [finalCheckoutTime, bookingId]
        );

        await dbService.run(
          `UPDATE rooms SET status = 'Available' WHERE id = ?`,
          [booking.room_id]
        );

        // ── Billing insert ────────────────────────────────────────
        // booking.check_in is read straight from the DB row — it is
        // whatever the mysql2 driver returns.  We pass it through
        // as-is; MySQL will store it back without reinterpretation.
        const billingSql = `INSERT INTO billings (
            booking_id, idempotency_key, customer_id, room_id,
            check_in, check_out, advance_paid, discount, total_amount,
            gst_number, billed_by_id, billed_by_name, billed_by_role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const billingParams = [
          booking.booking_id,
          key,
          booking.customer_id,
          booking.room_id,
          booking.check_in,
          finalCheckoutTime
        ];
        billingParams.push(
          advancePaid,
          discountToApply,
          expectedTotal,
          gst_number || null,
          user.id,
          user.name,
          user.role
        );

        const billingResult = await dbService.run(billingSql, billingParams);

        await this._createLineItems(billingResult.lastID, booking, stayDays, discountToApply);

        return billingResult.lastID;
      });

      return {
        success: true,
        billing_id: billingId,
        idempotency_key: key,
        summary: {
          booking_id:   booking.booking_id,
          roomTotal,
          kitchenTotal,
          addonTotal,
          total_amount:  expectedTotal,
          totalAmount:   expectedTotal,
          advancePaid,
          balance:       balanceAmount,
          balanceAmount,
        },
      };
    } catch (error) {
      console.error("Checkout failed:", error);
      throw error;
    }
  }

  async _createLineItems(billingId, booking, stayDays = 1, appliedDiscount = 0) {
    const lines = [];

    const roomUnitPrice = Number(booking.price || 0);
    const roomSubtotal  = roomUnitPrice * stayDays;

    lines.push({
      billing_id:  billingId,
      type:        "room",
      description: `Room ${booking.room_number} (${booking.category}) x ${stayDays} night`,
      quantity:    stayDays,
      unit_price:  roomUnitPrice,
      subtotal:    roomSubtotal,
      gst_rate:    this._getGstRate("room", roomUnitPrice),
      total:       roomSubtotal,
    });

    const kitchenOrders = await dbService.getKitchenOrdersForInvoice(booking.booking_id);

    for (const kitchenOrder of kitchenOrders) {
      const quantity  = Number(kitchenOrder.quantity || 1);
      const lineTotal = Number(kitchenOrder.total || 0);
      const unitPrice = quantity > 0 ? lineTotal / quantity : lineTotal;

      lines.push({
        billing_id:  billingId,
        type:        "kitchen",
        description: kitchenOrder.item_name,
        quantity,
        unit_price:  unitPrice,
        subtotal:    lineTotal,
        gst_rate:    DEFAULT_GST_RATES.addon,
        total:       lineTotal,
      });
    }

    const addons = await dbService.getBookingAddons(booking.booking_id);

    for (const addon of addons) {
      lines.push({
        billing_id:  billingId,
        type:        "addon",
        description: addon.name,
        quantity:    1,
        unit_price:  Number(addon.price || 0),
        subtotal:    Number(addon.price || 0),
        gst_rate:    DEFAULT_GST_RATES.addon,
        total:       Number(addon.price || 0),
      });
    }

    if (appliedDiscount > 0) {
      lines.push({
        billing_id:  billingId,
        type:        "discount",
        description: "Discount Applied",
        quantity:    1,
        unit_price:  -appliedDiscount,
        subtotal:    -appliedDiscount,
        gst_rate:    0,
        total:       -appliedDiscount,
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
