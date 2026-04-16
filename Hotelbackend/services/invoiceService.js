const dbService = require('./dbService');
const { DEFAULT_GST_RATES, HOTEL_GST_NUMBER } = require('../utils/billingUtils');

/**
 * Invoice service for line items and PDF data preparation
 */
class InvoiceService {
  /**
   * Get complete invoice data for billing (line items + totals)
   */
  async getInvoiceData(billingId) {
    const billing = await dbService.get(
      `SELECT b.*, c.name as customer_name, c.address, c.contact,
              COALESCE(r_live.room_number, r_stale.room_number) as room_number,
              COALESCE(r_live.category, r_stale.category) as category,
              u.name as billed_by_name, u.role as billed_by_role
       FROM billings b
       LEFT JOIN bookings bk ON b.booking_id = bk.booking_id
       LEFT JOIN rooms r_live ON bk.room_id = r_live.id
       LEFT JOIN rooms r_stale ON b.room_id = r_stale.id
       LEFT JOIN customers c ON b.customer_id = c.id
       LEFT JOIN users u ON b.billed_by_id = u.id
       WHERE b.id = ?`,
      [billingId]
    );

    if (!billing) {
      throw new Error('Billing not found');
    }

    // Get line items grouped by type
    const lines = await dbService.all(
      `SELECT * FROM invoices WHERE billing_id = ? ORDER BY type, id`,
      [billingId]
    );

    const groupedLines = this._groupLines(lines);
    
    // Compute totals
    const totals = this._computeTotals(groupedLines, billing.total_amount);

    return {
      ...billing,
      lines: groupedLines,
      totals,
      nights: this._calculateNights(billing.check_in, billing.check_out),
      balance: Number(billing.total_amount || 0) - Number(billing.advance_paid || 0),
      hotel_gst: HOTEL_GST_NUMBER
    };
  }

  /**
   * Get summary for PDF generation
   */
  async getInvoiceSummary(billingId) {
    const data = await this.getInvoiceData(billingId);
    
    return {
      bill_id: data.id,
      customer_name: data.customer_name,
      room: data.room_number ? `${data.room_number} (${data.category})` : 'N/A',
      check_in: data.check_in,
      check_out: data.check_out,
      total_amount: data.total_amount,
      line_items: data.lines,
      totals: data.totals,
      gst_number: data.gst_number || 'N/A'
    };
  }

  _groupLines(lines) {
    const groups = {};
    for (const line of lines) {
      const type = line.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(line);
    }
    return groups;
  }

  _computeTotals(lines, grandTotal) {
    let subtotal = 0;
    let gstTotal = 0;

    for (const type in lines) {
      for (const line of lines[type]) {
        subtotal += Number(line.subtotal || 0);      // ✅ FIX
        gstTotal += Number(line.gst_amount || 0);    // ✅ FIX
      }
    }

    const safeSubtotal = Number(subtotal);
    const safeGst = Number(gstTotal);

    return {
      subtotal: Number(safeSubtotal.toFixed(2)),
      gst_total: Number(safeGst.toFixed(2)),
      grand_total: Number(grandTotal || 0),
      gst_rate_avg: safeSubtotal > 0
        ? Number(((safeGst / safeSubtotal) * 100).toFixed(1))
        : 0
    };
  }

  _calculateNights(checkIn, checkOut) {
    try {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const diffTime = outDate - inDate;
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, nights);
    } catch {
      return 1;
    }
  }
}

module.exports = new InvoiceService();

