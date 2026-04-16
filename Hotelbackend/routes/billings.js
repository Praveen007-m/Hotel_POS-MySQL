const express = require("express");
const router = express.Router();
const db = require("../db/database");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const billingController = require("../controllers/profitController");

/* ===============================
   GET TOTAL PROFIT
   URL: /api/billings/profit
================================ */
router.get("/profit", billingController.getProfit);

/* ===============================
   GET ALL BILLS
   URL: /api/billings
================================ */
const billingService = require('../services/billingService');

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const result = await billingService.getBillings({ 
      page: parseInt(page), 
      limit: parseInt(limit), 
      search: search || '' 
    });
    res.json(result);
  } catch (error) {
    console.error("❌ FETCH BILLS FAILED:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   GET BILLING PREVIEW (for checkout)
   URL: /api/billings/preview/:bookingId
   Returns full billing calculation with room + addons + kitchen
   WITHOUT persisting anything
================================ */
router.get("/preview/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  
  try {
    const preview = await billingService.getBillingPreview(bookingId);
    res.json(preview);
  } catch (error) {
    console.error("❌ BILLING PREVIEW FAILED:", error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   GET SINGLE BILL + DETAILS
   URL: /api/billings/:id
================================ */
router.get("/:id", async (req, res) => {
  const billId = req.params.id;
  
  try {
    const billingService = require('../services/billingService');
    const bill = await billingService.getBillingDetails(billId);
    res.json(bill);
  } catch (error) {
    console.error("❌ GET BILLING DETAILS FAILED:", error);
    if (error.message === 'Billing not found') {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   DELETE BILL
   URL: /api/billings/:id
================================ */
router.delete("/:id", async (req, res) => {
  const billId = req.params.id;

  try {
    const [result] = await db.query("DELETE FROM billings WHERE id = ?", [billId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    console.log("✅ BILL DELETED:", billId);
    res.json({ message: "Bill deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE BILL FAILED:", err);
    res.status(500).json({ error: "Failed to delete bill" });
  }
});

/* ===============================
   MARK BILL AS DOWNLOADED
   URL: PATCH /api/billings/:id/downloaded
================================ */
router.patch("/:id/downloaded", async (req, res) => {
  const billId = req.params.id;
  const { gst_number } = req.body;

  const updates = ["is_downloaded = 1"];
  const params = [];

  if (gst_number !== undefined && gst_number !== null) {
    updates.push("gst_number = ?");
    params.push(gst_number);
  }

  params.push(billId);
  const sql = `UPDATE billings SET ${updates.join(", ")} WHERE id = ?`;

  try {
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    console.log("✅ BILL MARKED DOWNLOADED:", billId);
    if (gst_number) {
      console.log("✅ GST NUMBER SAVED:", gst_number);
    }
    res.json({ message: "Bill marked as downloaded" });
  } catch (err) {
    console.error("❌ MARK DOWNLOADED FAILED:", err);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

router.get("/export/csv", async (req, res) => {
  /*
    Simple billing export with columns: ID, Invoice No., Name, Guest GST No.,
    Room description, HSN Code Hotel, Room price.
    Output remains an Excel file with header styling.
  */
  const sql = `
    SELECT
      b.id AS id,
      c.name AS customer_name,
      b.gst_number,
      COALESCE(
        CONCAT(r_live.room_number, ' / ', r_live.category),
        CONCAT(r_stale.room_number, ' / ', r_stale.category)
      ) AS room_description,
      b.total_amount AS room_price
    FROM billings b
    LEFT JOIN bookings bk ON bk.booking_id = b.booking_id
    LEFT JOIN rooms r_live ON r_live.id = bk.room_id
    LEFT JOIN rooms r_stale ON r_stale.id = b.room_id
    LEFT JOIN customers c ON c.id = b.customer_id
    ORDER BY b.created_at DESC
  `;

  try {
    const [rows] = await db.query(sql);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Billing Statements");

      // header row with requested columns
      const headerRow = worksheet.addRow([
        "ID",
        "Invoice No.",
        "Name",
        "Guest GST No.",
        "Room description",
        "HSN Code Hotel",
        "Room price",
      ]);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "center" };

      worksheet.getColumn(1).width = 6;
      worksheet.getColumn(2).width = 15;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 18;
      worksheet.getColumn(5).width = 20;
      worksheet.getColumn(6).width = 15;
      worksheet.getColumn(7).width = 15;

      // populate rows and keep a running total of room prices
      let totalRoomPrice = 0;
      rows.forEach((row) => {
        const invoiceNo = `INV-${String(row.id).padStart(6, "0")}`;
        const price = parseFloat(row.room_price) || 0;
        worksheet.addRow([
          row.id,
          invoiceNo,
          row.customer_name || "",
          row.gst_number || "",
          row.room_description || "",
          "", // empty HSN Code Hotel
          price,
        ]);
        totalRoomPrice += price;
      });

      // append blank line and total row
      worksheet.addRow([]);
      const totalRow = worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "Total",
        totalRoomPrice,
      ]);
      totalRow.font = { bold: true };
      totalRow.alignment = { horizontal: "right", vertical: "center" };

      // alternate row coloring (exclude header and total row)
      worksheet.eachRow((r, rowNumber) => {
        if (rowNumber > 1 && rowNumber < totalRow.number) {
          if (rowNumber % 2 === 0) {
            r.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF2F2F2" },
            };
          }
          r.alignment = { horizontal: "left", vertical: "center" };
        }
      });

      // headers for excel
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=billing-statements.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to generate export" });
    }
});

module.exports = router;
