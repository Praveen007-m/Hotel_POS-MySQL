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
    width: "44%",
  },
  colQty: {
    width: "12%",
    textAlign: "center",
  },
  colRate: {
    width: "22%",
    textAlign: "right",
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

const THERMAL_WIDTH = 226; // ~80mm printer roll

const RestaurantBillDocument = ({
  restaurantName,
  tableNo,
  billNo,
  items,
  subtotal,
  gstIncluded,
  gstRate,
  gstAmount,
  totalAmount,
  issuedAt,
  pageHeight,
}) => (
  <Document>
    <Page size={[THERMAL_WIDTH, pageHeight]} style={styles.page}>
      <View style={styles.ticket}>
        <View style={styles.headerRow}>
          <Image style={styles.logo} src="/FridayInnLogo.png" />
          <View style={styles.hotelMeta}>
            <Text style={styles.title}>
              {restaurantName || "HOTEL FRIDAY INN"}
            </Text>
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
        <Text style={styles.sectionTitle}>RESTAURANT ORDER BILL</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Bill No:</Text>
          <Text>{billNo}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Table:</Text>
          <Text>{tableNo}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaKey}>Date:</Text>
          <Text>{issuedAt}</Text>
        </View>

        <View style={[styles.divider, { marginTop: 6 }]} />

        <View style={styles.tableHeader}>
          <Text style={[styles.colItem, styles.bold]}>Item</Text>
          <Text style={[styles.colQty, styles.bold]}>Qty</Text>
   
          <Text style={[styles.colAmount, styles.bold]}>Amount</Text>
        </View>

        {items.map((item, index) => (
          <View style={styles.itemRow} key={`restaurant-item-${index}`}>
            <Text style={styles.colItem}>{item.item_name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
      
            <Text style={[styles.colAmount, styles.bold]}>
              {currency(item.total)}
            </Text>
          </View>
        ))}

        <View style={[styles.divider, { marginTop: 4 }]} />

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
  }, 2000);
};

export const generateRestaurantBillPDF = async ({
  restaurantName = "HOTEL FRIDAY INN",
  tableNo = "-",
  billNo = "-",
  orders = [],
  gstRate = 0.05,
  gstIncluded = true,
  formatIST,
} = {}) => {
  if (!Array.isArray(orders) || orders.length === 0) return;

  const items = orders.map((o) => {
    const quantity = Number(o.quantity) || 0;
    const price = Number(o.price) || 0;
    return {
      item_name: o.item_name || "Item",
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
    Math.min(1400, 250 + items.length * 18 + (gstIncluded ? 20 : 0)),
  );

  try {
    const doc = (
      <RestaurantBillDocument
        restaurantName={restaurantName}
        tableNo={tableNo}
        billNo={billNo}
        items={items}
        subtotal={subtotal}
        gstIncluded={gstIncluded}
        gstRate={gstRate}
        gstAmount={gstAmount}
        totalAmount={totalAmount}
        issuedAt={issuedAt}
        pageHeight={pageHeight}
      />
    );

    const blob = await pdf(doc).toBlob();
    triggerBlobDownload(blob, `Restaurant-Bill-${billNo}.pdf`);
  } catch (error) {
    console.error("Restaurant bill PDF generation failed:", error);
    alert(`Restaurant bill PDF generation failed: ${error.message}`);
  }
};

export default generateRestaurantBillPDF;