import React from 'react';
import { pdf, Document, Page, Text, View } from '@react-pdf/renderer';
import HotelInvoiceDocument from '../components/billing/HotelInvoiceDocument';

/**
 * Generate Invoice PDF via Frontend using @react-pdf/renderer
 */
const FallbackInvoiceDocument = ({ selectedBill }) => {
  const billId = selectedBill?.bill_id || selectedBill?.id || "N/A";
  const checkIn = selectedBill?.check_in ? new Date(selectedBill.check_in).toLocaleString() : "N/A";
  const checkOut = selectedBill?.check_out ? new Date(selectedBill.check_out).toLocaleString() : "N/A";

  return (
    <Document>
      <Page size="A4" style={{ padding: 24, fontFamily: "Helvetica", fontSize: 10 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>HOTEL FRIDAY INN</Text>
        <Text style={{ marginBottom: 6 }}>Invoice #{billId}</Text>
        <Text style={{ marginBottom: 6 }}>Guest: {selectedBill?.customer_name || "Guest"}</Text>
        <Text style={{ marginBottom: 6 }}>Room: {selectedBill?.room_id || "N/A"}</Text>
        <Text style={{ marginBottom: 6 }}>Check In: {checkIn}</Text>
        <Text style={{ marginBottom: 6 }}>Check Out: {checkOut}</Text>
        <View style={{ marginTop: 16 }}>
          <Text>This is a compatibility fallback invoice.</Text>
          <Text>Use this file while the styled template is unavailable.</Text>
        </View>
      </Page>
    </Document>
  );
};

const triggerBlobDownload = (blob, filename) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1500);
};

export const generateInvoicePDF = async (props) => {
  const { selectedBill, action = "download" } = props;

  if (!selectedBill) {
    console.error("generateInvoicePDF: No selectedBill provided");
    alert("Error: Bill information is missing. Please reload and try again.");
    return;
  }

  if (!selectedBill.check_in || !selectedBill.check_out) {
    console.error("generateInvoicePDF: Missing check-in or check-out dates");
    alert("Error: Check-in and check-out dates are required.");
    return;
  }

  try {
    const billId = selectedBill.bill_id || selectedBill.id || "invoice";
    const filename = `Hotel_Invoice_${billId}_${Date.now()}.pdf`;
    let blob;

    // 1) Try the full-styled invoice first.
    try {
      const doc = <HotelInvoiceDocument {...props} />;
      blob = await pdf(doc).toBlob();
    } catch (primaryError) {
      console.error("Primary invoice template failed, trying fallback template:", primaryError);

      // 2) Fallback template avoids external font/image dependencies.
      const fallbackDoc = <FallbackInvoiceDocument selectedBill={selectedBill} />;
      blob = await pdf(fallbackDoc).toBlob();
    }

    if (action === "download") {
      triggerBlobDownload(blob, filename);
      return;
    }

    const blobUrl = window.URL.createObjectURL(blob);

    if (action === "open") {
      // Open in new tab
      window.open(blobUrl, "_blank");
    } else if (action === "print") {
      // Open print dialog
      const printWindow = window.open(blobUrl);
      printWindow?.print();
    }

    // Cleanup for open/print URL usage.
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert(`Error generating PDF: ${error?.message || "Unknown error"}`);
  }
};

export default generateInvoicePDF;
