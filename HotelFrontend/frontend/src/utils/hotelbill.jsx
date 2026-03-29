import React from "react";
import {
  Font,
  Image,
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Font registration (wrapped to avoid crashes if CDN is unreachable) ──────
try {
  Font.register({
    family: "Poppins",
    fonts: [
      {
        src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf",
        fontWeight: 400,
      },
      {
        src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Medium.ttf",
        fontWeight: 500,
      },
      {
        src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf",
        fontWeight: 700,
      },
    ],
  });
} catch (e) {
  console.warn("Poppins font registration failed, falling back to default.", e);
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 6,
    backgroundColor: "#ffffff",
    fontFamily: "Poppins",
    fontSize: 8,
    color: "#111827",
  },
  ticket: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  logo: {
    width: 56,
    height: 56,
    objectFit: "contain",
    marginRight: 8,
  },
  hotelMeta: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 1,
  },
  address: {
    fontSize: 6.8,
    lineHeight: 1.25,
  },
  contact: {
    fontSize: 6.8,
    marginTop: 2,
    lineHeight: 1.25,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginBottom: 6,
  },
  sectionTitle: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 8.8,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  metaKey: {
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 4,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  colItem: {
    width: "66%",
  },
  colQty: {
    width: "12%",
    textAlign: "center",
  },
  colAmount: {
    width: "22%",
    textAlign: "right",
  },
  bold: {
    fontWeight: 700,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  footer: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 7.2,
    color: "#4b5563",
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const currency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const formatNow = (formatIST) => {
  if (typeof formatIST === "function") return formatIST(new Date());
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Resolve logo to an absolute URL so @react-pdf/renderer can fetch it
const getLogoSrc = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/FridayInnLogo.png`;
  }
  return "/FridayInnLogo.png";
};

const THERMAL_WIDTH = 226;

// ── Document component ───────────────────────────────────────────────────────
const KitchenBillDocument = ({
  billNo,
  roomNo,
  items,
  subtotal,
  gstIncluded,
  gstRate,
  gstAmount,
  totalAmount,
  issuedAt,
  pageHeight,
  logoSrc,
}) => (
  <Document>
    <Page size={[THERMAL_WIDTH, pageHeight]} style={styles.page}>
      <View style={styles.ticket}>
        {/* Header */}
        <View style={styles.headerRow}>
          {logoSrc ? (
            <Image style={styles.logo} src={logoSrc} />
          ) : null}
          <View style={styles.hotelMeta}>
            <Text style={styles.title}>HOTEL FRIDAY INN</Text>
            <Text style={styles.address}>
              D.NO 307 ASAMBUR TO MANJAKUTTAI ROAD,{"\n"}
              ASAMBUR VILLAGE, YERCAUD - 636602,{"\n"}
              TAMIL NADU, INDIA.
            </Text>
            <Text style={styles.contact}>
              Call: +91 6369469094 | +91 9489690022 | 04281-290001.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>HOTEL ORDER BILL</Text>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Bill No:</Text>
          <Text>{billNo}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Room:</Text>
          <Text>{roomNo}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Date:</Text>
          <Text>{issuedAt}</Text>
        </View>

        <View style={[styles.divider, { marginTop: 6 }]} />

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colItem, styles.bold]}>Item</Text>
          <Text style={[styles.colQty, styles.bold]}>Qty</Text>
          <Text style={[styles.colAmount, styles.bold]}>Amount</Text>
        </View>

        {/* Items */}
        {items.map((item, index) => (
          <View style={styles.itemRow} key={`kitchen-item-${index}`}>
            <Text style={styles.colItem}>{item.item_name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={[styles.colAmount, styles.bold]}>
              {currency(item.total)}
            </Text>
          </View>
        ))}

        <View style={[styles.divider, { marginTop: 4 }]} />

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Text>Subtotal</Text>
          <Text>{currency(subtotal)}</Text>
        </View>
        {gstIncluded && (
          <View style={styles.totalsRow}>
            <Text>GST ({(gstRate * 100).toFixed(0)}%)</Text>
            <Text>{currency(gstAmount)}</Text>
          </View>
        )}
        <View style={[styles.totalsRow, { marginTop: 3 }]}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{currency(totalAmount)}</Text>
        </View>

        <Text style={styles.footer}>Thank you for dining at Hotel Friday Inn.</Text>
        <Text style={styles.footer}>Please visit again.</Text>
      </View>
    </Page>
  </Document>
);

// ── Download helper ──────────────────────────────────────────────────────────
const triggerBlobDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
};

// ── Main export ──────────────────────────────────────────────────────────────
export const generateKitchenBillPDF = async ({
  selectedBill,
  kitchenOrders = [],
  gstRate = 0.05,
  gstIncluded = true,
  formatIST,
} = {}) => {
  if (
    !selectedBill ||
    !Array.isArray(kitchenOrders) ||
    kitchenOrders.length === 0
  ) {
    console.warn("generateKitchenBillPDF: missing selectedBill or kitchenOrders.");
    return;
  }

  const billNo =
    selectedBill.bill_id ||
    selectedBill.id ||
    selectedBill.booking_id ||
    "N/A";

  const roomNo = selectedBill.room_id || "-";

  const items = kitchenOrders.map((k) => {
    const quantity = Number(k.quantity) || 0;
    const price = Number(k.price) || 0;
    return {
      item_name: k.item_name || "Item",
      quantity,
      price,
      total: quantity * price,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = gstIncluded ? subtotal * gstRate : 0;
  const totalAmount = subtotal + gstAmount;
  const issuedAt = formatNow(formatIST);
  const pageHeight = Math.max(
    360,
    Math.min(1400, 250 + items.length * 18 + (gstIncluded ? 20 : 0))
  );

  // Verify logo is reachable; fall back to null if not
  let logoSrc = getLogoSrc();
  try {
    const res = await fetch(logoSrc, { method: "HEAD" });
    if (!res.ok) logoSrc = null;
  } catch {
    logoSrc = null;
  }

  try {
    const doc = (
      <KitchenBillDocument
        billNo={billNo}
        roomNo={roomNo}
        items={items}
        subtotal={subtotal}
        gstIncluded={gstIncluded}
        gstRate={gstRate}
        gstAmount={gstAmount}
        totalAmount={totalAmount}
        issuedAt={issuedAt}
        pageHeight={pageHeight}
        logoSrc={logoSrc}
      />
    );

    // Compatible with both @react-pdf/renderer v2 and v3
    let blob;
    const pdfInstance = pdf(doc);
    if (typeof pdfInstance.toBlob === "function") {
      blob = await pdfInstance.toBlob();
    } else {
      // v3 API
      pdfInstance.updateContainer(doc);
      blob = await pdfInstance.toBlob();
    }

    triggerBlobDownload(blob, `Kitchen-Bill-${billNo}.pdf`);
  } catch (error) {
    console.error("Kitchen bill PDF generation failed:", error);
    alert(`Kitchen bill PDF generation failed: ${error.message}`);
  }
};

export default generateKitchenBillPDF;