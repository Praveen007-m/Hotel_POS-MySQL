const dbService = require('./dbService');
const invoiceService = require('./invoiceService');

/**
 * Billing service for list operations and enhancements
 */
class BillingService {
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
      SELECT b.*, c.name as customer_name,
             COUNT(i.id) as line_items_count,
             SUM(i.total) as line_items_total
      FROM billings b 
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN invoices i ON b.id = i.billing_id
      ${whereClause}
      GROUP BY b.id
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

