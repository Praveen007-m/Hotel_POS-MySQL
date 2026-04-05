const dbService = require('./dbService');
const invoiceService = require('./invoiceService');
const { DEFAULT_GST_RATES } = require('../utils/billingUtils');

/**
 * Billing service for list operations and enhancements
 */
class BillingService {
  /**
   * Get billing preview (NOT persisted)
   * Used for checkout modal and bill preview before finalization
   */
  async getBillingPreview(bookingId) {
    const booking = await dbService.get(
      `SELECT b.*, c.name AS customer_name, c.contact, c.address,
              r.room_number, r.category, r.price_per_night
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Calculate stay days
    const checkInDate = new Date(booking.check_in);
    const checkOutDate = new Date(booking.check_out);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);
    const stayDays = Math.max(
      Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
      1
    );

    // ========== ROOM CHARGES ==========
    const roomTotal = Number(booking.price_per_night || 0) * stayDays;

    // ========== ADD-ONS ==========
    const addonsData = await dbService.all(
      `SELECT id, name, price FROM booking_addons WHERE booking_id = ?`,
      [booking.booking_id]
    );
    const addonsTotal = addonsData.reduce(
      (sum, a) => sum + Number(a.price || 0),
      0
    );

    // ========== TOTALS ==========
    const subtotal = roomTotal + addonsTotal;
    const gstRate = this._getGstRate('room', roomTotal);
    const gst = subtotal * gstRate;
    const total = subtotal + gst;
    const advancePaid = Number(booking.advance_paid || 0);
    const balance = total - advancePaid;

    return {
      booking_id: booking.booking_id,
      customer_id: booking.customer_id,
      customer_name: booking.customer_name,
      customer_contact: booking.contact,
      customer_address: booking.address,
      room_id: booking.room_id,
      room_number: booking.room_number,
      room_category: booking.category,
      check_in: booking.check_in,
      check_out: booking.check_out,
      stay_days: stayDays,
      room_price_per_night: Number(booking.price_per_night || 0),
      
      // ✅ BILLING BREAKDOWN
      room_charges: Number(roomTotal.toFixed(2)),
      add_ons_total: Number(addonsTotal.toFixed(2)),
      
      // ✅ ADD-ONS DETAILS
      add_ons: addonsData.map(a => ({
        id: a.id,
        name: a.name,
        price: Number(a.price || 0)
      })),
      
      // ✅ FINAL TOTALS
      subtotal: Number(subtotal.toFixed(2)),
      gst_rate: gstRate,
      gst: Number(gst.toFixed(2)),
      total: Number(total.toFixed(2)),
      advance_paid: Number(advancePaid.toFixed(2)),
      balance: Number(balance.toFixed(2))
    };
  }

  _getGstRate(type, amount) {
    if (type === "room" && amount > DEFAULT_GST_RATES.room.threshold) {
      return DEFAULT_GST_RATES.room.high;
    }
    const rates = DEFAULT_GST_RATES[type];
    return typeof rates === "object" ? rates.low : rates || 0;
  }

  /**
   * Get all billings with line item summary
   */
  async getBillings({ page = 1, limit = 50, search = '' } = {}) {
    const offset = (page - 1) * limit;
    
    const whereClause = search 
      ? `WHERE b.booking_id LIKE ? OR c.name LIKE ? OR b.gst_number LIKE ?`
      : '';
    const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    params.push(limit, offset);

    const billings = await dbService.all(`
      SELECT 
        b.id,
        b.booking_id AS booking_id,   -- ✅ FIXED: Use billings.booking_id directly (it has the formatted codes or numeric IDs)
        b.customer_id,
        b.room_id,
        b.total_amount,
        b.advance_paid,
        b.created_at,
        b.is_downloaded,
        b.billed_by_name,
        b.billed_by_role,
        c.name as customer_name,
        COUNT(i.id) as line_items_count,
        SUM(i.total) as line_items_total
      FROM billings b 
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN invoices i ON b.id = i.billing_id
      ${whereClause}
      GROUP BY 
        b.id,
        b.booking_id,   -- ✅ FIXED: Group by billings.booking_id
        b.customer_id,
        b.room_id,
        b.total_amount,
        b.advance_paid,
        b.created_at,
        b.is_downloaded,
        b.billed_by_name,
        b.billed_by_role,
        c.name
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `, params);

const countParams = search 
  ? [`%${search}%`, `%${search}%`, `%${search}%`] 
  : [];

const total = await dbService.get(`
  SELECT COUNT(DISTINCT b.id) as count
  FROM billings b
  LEFT JOIN customers c ON b.customer_id = c.id
  ${whereClause}
`, countParams);

    return {
      billings,
      pagination: {
        page,
        limit,
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    };
  }

  /**
   * Get billing details with full line items
   */
  async getBillingDetails(billingId) {
    return await invoiceService.getInvoiceData(billingId);
  }

  /**
   * Mark billing as downloaded + save GST number
   */
  async markDownloaded(billingId, gstNumber) {
    await dbService.run(
      'UPDATE billings SET is_downloaded = 1, gst_number = ? WHERE id = ?',
      [gstNumber, billingId]
    );
  }

  /**
   * Get profit/loss summary
   */
  async getProfitSummary({ startDate, endDate } = {}) {
    const whereClause = endDate ? 'WHERE DATE(b.created_at) BETWEEN ? AND ?' : '';
    const params = endDate ? [startDate, endDate] : [];

    const profit = await dbService.get(`
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_bill,
        SUM(advance_paid) as total_advance
      FROM billings b
      ${whereClause}
    `, params);

    return profit || { total_bills: 0, revenue: 0, avg_bill: 0, total_advance: 0 };
  }
}

module.exports = new BillingService();
