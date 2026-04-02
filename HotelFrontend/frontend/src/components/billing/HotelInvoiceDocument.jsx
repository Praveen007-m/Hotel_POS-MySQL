import React from "react";
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const BORDER_COLOR = "#000000";

// ===== QR CODE IMAGE PATHS =====
// These should point to your public folder or CDN
const INSTAGRAM_QR_PATH = "/insta_qr.jpeg";
const WEBSITE_QR_PATH = "/hotel_qr.jpeg";

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
      src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-SemiBold.ttf",
      fontWeight: 600,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf",
      fontWeight: 700,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Italic.ttf",
      fontStyle: "italic",
      fontWeight: 400,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Poppins",
    fontSize: 9,
  },
  // --- Header ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#ffffff",
    padding: 8,
    borderWidth: 1,
    borderColor: "#000000",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerQR: {
    width: 70,
    height: 70,
    objectFit: "contain",
    marginBottom: 4,
  },
  headerQRLabel: {
    fontSize: 7,
    fontWeight: 600,
    textAlign: "center",
  },
  logo: {
    width: 120,
    height: 120,
    objectFit: "contain",
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  hotelName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#000000",
    marginBottom: 3,
  },
  address: {
    fontSize: 8.5,
    color: "#000000",
    marginBottom: 2,
    lineHeight: 1.35,
  },
  contact: {
    fontSize: 8.5,
    color: "#000000",
    marginBottom: 3,
    lineHeight: 1.35,
  },
  gstBanner: {
    color: "#000000",
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: 600,
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  // --- Guest & Stay Details ---
  detailsContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 0,
  },
  guestLeftBox: {
    flex: 0.4,
    padding: 8,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: "center",
  },
  guestRightBox: {
    flex: 0.6,
  },
  rightTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
  },
  rightTableRowLast: {
    flexDirection: "row",
  },
  detailLabel: {
    width: "25%",
    padding: 4,
    fontWeight: 600,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
  },
  detailValue: {
    width: "25%",
    padding: 4,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
  },
  detailValueLast: {
    width: "25%",
    padding: 4,
  },
  detailLabelSingle: {
    width: "25%",
    padding: 4,
    fontWeight: 600,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
  },
  detailValueSingle: {
    width: "75%",
    padding: 4,
  },

  // --- Billing Particulars Table ---
  table: {
    width: "100%",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER_COLOR,
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tableRowLast: {
    flexDirection: "row",
  },
  col1: {
    width: "15%",
    padding: 5,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    textAlign: "center",
  },
  col2: {
    width: "40%",
    padding: 5,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
  },
  col3: {
    width: "15%",
    padding: 5,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    textAlign: "right",
  },
  col4: {
    width: "15%",
    padding: 5,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    textAlign: "right",
  },
  col5: {
    width: "15%",
    padding: 5,
    textAlign: "right",
  },
  colHeader: {
    fontWeight: 600,
  },

  // --- Footer Section ---
  footer: {
    marginTop: "auto",
  },
  usersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    fontSize: 8,
  },
  disclaimer: {
    fontSize: 8,
    textAlign: "justify",
    marginBottom: 20,
    fontStyle: "italic",
  },
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  signatureBox: {
    width: "30%",
    borderTopWidth: 1,
    borderColor: BORDER_COLOR,
    textAlign: "center",
    paddingTop: 5,
    fontWeight: 600,
    fontSize: 10,
  },
  boldText: {
    fontWeight: 600,
  },
  
  // --- QR Codes Section ---
  qrSection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    alignItems: "center",
  },
  qrLabel: {
    fontSize: 9,
    fontWeight: 600,
    marginBottom: 8,
    textAlign: "center",
  },
  qrContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    alignItems: "flex-start",
  },
  qrBox: {
    alignItems: "center",
  },
  qrImage: {
    width: 60,
    height: 60,
    marginBottom: 4,
    objectFit: "contain",
  },
  qrText: {
    fontSize: 8,
    textAlign: "center",
    fontWeight: 500,
  },
});

export const HotelInvoiceDocument = ({
  selectedBill,
  form,
  gstIncluded,
  gstRates,
  gstAmounts,
  subtotal,
  subtotalWithGst,
  totalAmount,
  advancePaid,
  balanceAmount,
  guestDiscount,
  gstNumber,
  formatIST,
}) => {
  const getISTDateParts = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date);

    const pick = (type) => parts.find((p) => p.type === type)?.value || "";

    return {
      day: pick("day"),
      month: pick("month"),
      year: pick("year"),
      hour: pick("hour"),
      minute: pick("minute"),
      dayPeriod: (pick("dayPeriod") || "").toLowerCase(),
    };
  };

  const formatDateOnly = (value) => {
    const parts = getISTDateParts(value);
    if (!parts) return "N/A";
    return `${parts.day} ${parts.month} ${parts.year}`;
  };

  const formatDateTime = (value) => {
    const parts = getISTDateParts(value);
    if (!parts) return "N/A";
    return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
  };

  // Safe defaults
  const billNo = selectedBill?.bill_id || selectedBill?.id || "N/A";
  const dateStr = formatDateTime(new Date());
  const roomCat = selectedBill?.room_category || "Standard Room";
  const pax = selectedBill?.pax || "2";
  const nationality = "Indian";
  const checkInStr = formatDateTime(selectedBill?.check_in);
  const checkOutStr = formatDateTime(selectedBill?.check_out);

  const numDays = (() => {
    if (selectedBill?.check_in && selectedBill?.check_out) {
      const diffTime = Math.abs(
        new Date(selectedBill.check_out) - new Date(selectedBill.check_in),
      );
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    }
    return 1;
  })();

  const lineItemDateOnly = formatDateOnly(
    selectedBill?.check_out || selectedBill?.check_in || new Date(),
  );

  // GST logic
  const roomPrice = Number(form?.room_price || 0);
  const addOns = Array.isArray(form?.add_ons) ? form.add_ons : [];
  
  // ✅ GET KITCHEN ITEMS FROM SELECTED BILL LINES
  let kitchenItems = [];
  if (selectedBill?.lines?.kitchen && Array.isArray(selectedBill.lines.kitchen)) {
    kitchenItems = selectedBill.lines.kitchen;
  }

  const roomGstAmount = Number(gstAmounts?.room || 0);
  const addonGstAmount = Number(gstAmounts?.addon || 0);
  const kitchenGstAmount = Number(gstAmounts?.kitchen || 0);

  // ✅ INCLUDE KITCHEN GST IN TOTAL
  const totalGstAmount = roomGstAmount + addonGstAmount + kitchenGstAmount;

  const roomDiscountVal = Number(form?.discount || 0);
  const discountedRoomTariff = Math.max(0, roomPrice - roomDiscountVal);

  const totalGrossValue = subtotal;
  const billedByName =
    selectedBill?.billed_by_name ||
    selectedBill?.billed_by?.name ||
    selectedBill?.created_by_name ||
    "Staff/Admin";
  const billedByRoleRaw =
    selectedBill?.billed_by_role ||
    selectedBill?.billed_by?.role ||
    selectedBill?.created_by_role ||
    "";
  const billedByRole = billedByRoleRaw
    ? `${billedByRoleRaw.charAt(0).toUpperCase()}${billedByRoleRaw.slice(1)}`
    : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1. Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src="/FridayInnLogo.png" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.hotelName}>HOTEL FRIDAY INN</Text>
              <Text style={styles.address}>
                D.NO 307 ASAMBUR TO MANJAKUTTAI ROAD,{"\n"}
                ASAMBUR VILLAGE, YERCAUD - 636602,{"\n"}
                TAMIL NADU, INDIA.
              </Text>
              <Text style={styles.contact}>
                Call: +91 6369469094 | +91 9489690022 | 04281 - 290001.
              </Text>
              <Text style={styles.contact}>
                Email:reservation@fridayinnyercaud.com
              </Text>
              <Text style={styles.gstBanner}>GST NO: 33AMQPK7880E1ZP</Text>
            </View>
          </View>

          {/* Instagram QR in Header */}
          <View style={styles.headerRight}>
            <Image 
              style={styles.headerQR} 
              src={INSTAGRAM_QR_PATH}
            />
            <Text style={styles.headerQRLabel}>Follow us on</Text>
            <Text style={styles.headerQRLabel}>Instagram</Text>
          </View>
        </View>

        {/* 2. Guest & Stay Details */}
        <View style={styles.detailsContainer}>
          {/* Left Side */}
          <View style={styles.guestLeftBox}>
            <Text>
              <Text style={styles.boldText}>Name:</Text>{" "}
              {selectedBill?.customer_name || "Guest"}
            </Text>
            <Text style={{ marginTop: 4 }}>
              <Text style={styles.boldText}>Address:</Text>{" "}
              {selectedBill?.customer_address ||
                selectedBill?.customer_location ||
                "N/A"}
            </Text>
            {gstNumber && (
              <Text style={{ marginTop: 4 }}>
                <Text style={styles.boldText}>Guest GST:</Text> {gstNumber}
              </Text>
            )}
          </View>

          {/* Right Side */}
          <View style={styles.guestRightBox}>
            <View style={styles.rightTableRow}>
              <Text style={styles.detailLabelSingle}>Date</Text>
              <Text style={styles.detailValueSingle}>{dateStr}</Text>
            </View>
            <View style={styles.rightTableRow}>
              <Text style={styles.detailLabel}>Room</Text>
              <Text style={styles.detailValue}>
                {selectedBill?.room_id || "N/A"}
              </Text>
              <Text style={styles.detailLabel}>Pax</Text>
              <Text style={styles.detailValueLast}>{pax}</Text>
            </View>
            <View style={styles.rightTableRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{roomCat}</Text>
              <Text style={styles.detailLabel}>Nationality</Text>
              <Text style={styles.detailValueLast}>{nationality}</Text>
            </View>
            <View style={styles.rightTableRow}>
              <Text style={styles.detailLabelSingle}>Check In</Text>
              <Text style={styles.detailValueSingle}>{checkInStr}</Text>
            </View>
            <View style={styles.rightTableRow}>
              <Text style={styles.detailLabelSingle}>Check Out</Text>
              <Text style={styles.detailValueSingle}>{checkOutStr}</Text>
            </View>
            <View style={styles.rightTableRowLast}>
              <Text style={styles.detailLabel}>No. of Days</Text>
              <Text style={styles.detailValue}>{numDays}</Text>
              <Text style={styles.detailLabel}>Bill No</Text>
              <Text style={styles.detailValueLast}>{billNo}</Text>
            </View>
          </View>
        </View>

        {/* 3. Billing Particulars Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.colHeader]}>DATE</Text>
            <Text style={[styles.col2, styles.colHeader]}>DESCRIPTION</Text>
            <Text style={[styles.col3, styles.colHeader]}>DEBIT</Text>
            <Text style={[styles.col4, styles.colHeader]}>CREDIT</Text>
            <Text style={[styles.col5, styles.colHeader]}>AMOUNT</Text>
          </View>

          {/* Room Tariff Row */}
          <View style={styles.tableRow}>
            <Text style={styles.col1}>{lineItemDateOnly}</Text>
            <Text style={styles.col2}>
              Room Tariff{" "}
              {roomDiscountVal > 0
                ? `(Discount: -₹${roomDiscountVal.toFixed(2)})`
                : ""}
            </Text>
            <Text style={styles.col3}>{discountedRoomTariff.toFixed(2)}</Text>
            <Text style={styles.col4}>0.00</Text>
            <Text style={styles.col5}>{discountedRoomTariff.toFixed(2)}</Text>
          </View>

          {/* Add-ons Rows */}
          {addOns.map((addon, i) => {
            const addonTotal = Number(addon.price) * Number(addon.qty);
            return (
              <View style={styles.tableRow} key={`addon-${i}`}>
                <Text style={styles.col1}>{lineItemDateOnly}</Text>
                <Text style={styles.col2}>
                  {addon.name} (Qty: {addon.qty})
                </Text>
                <Text style={styles.col3}>{addonTotal.toFixed(2)}</Text>
                <Text style={styles.col4}>0.00</Text>
                <Text style={styles.col5}>{addonTotal.toFixed(2)}</Text>
              </View>
            );
          })}

          {/* ✅ KITCHEN ITEMS ROWS */}
          {kitchenItems.map((item, i) => {
            const itemTotal = Number(item.subtotal || 0);
            return (
              <View style={styles.tableRow} key={`kitchen-${i}`}>
                <Text style={styles.col1}>{lineItemDateOnly}</Text>
                <Text style={styles.col2}>
                  {item.description || item.name} (Qty: {item.quantity})
                </Text>
                <Text style={styles.col3}>{itemTotal.toFixed(2)}</Text>
                <Text style={styles.col4}>0.00</Text>
                <Text style={styles.col5}>{itemTotal.toFixed(2)}</Text>
              </View>
            );
          })}

          {/* GST Row */}
          {gstIncluded && totalGstAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>{lineItemDateOnly}</Text>
              <Text style={styles.col2}>
                GST ({(gstRates.room * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.col3}>{totalGstAmount.toFixed(2)}</Text>
              <Text style={styles.col4}>0.00</Text>
              <Text style={styles.col5}>{totalGstAmount.toFixed(2)}</Text>
            </View>
          )}

          {/* Subtotal Footer */}
          <View style={styles.tableRow}>
            <Text style={styles.col1}></Text>
            <Text
              style={[styles.col2, styles.boldText, { textAlign: "right" }]}
            >
              Total INR
            </Text>
            <Text style={styles.col3}></Text>
            <Text style={styles.col4}></Text>
            <Text style={[styles.col5, styles.boldText]}>
              {subtotalWithGst.toFixed(2)}
            </Text>
          </View>

          {/* Financial Summary Items appended to Table */}
          <View style={styles.tableRow}>
            <Text style={styles.col1}></Text>
            <Text
              style={[styles.col2, styles.boldText, { textAlign: "right" }]}
            >
              Gross Value
            </Text>
            <Text style={styles.col3}></Text>
            <Text style={styles.col4}></Text>
            <Text style={styles.col5}>{totalGrossValue.toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}></Text>
            <Text
              style={[styles.col2, styles.boldText, { textAlign: "right" }]}
            >
              Tax Amount
            </Text>
            <Text style={styles.col3}></Text>
            <Text style={styles.col4}></Text>
            <Text style={styles.col5}>{totalGstAmount.toFixed(2)}</Text>
          </View>
          {guestDiscount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}></Text>
              <Text
                style={[styles.col2, styles.boldText, { textAlign: "right" }]}
              >
                Guest Discount
              </Text>
              <Text style={styles.col3}></Text>
              <Text style={styles.col4}></Text>
              <Text style={styles.col5}>
                -{Number(guestDiscount).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.tableRow}>
            <Text style={styles.col1}></Text>
            <Text
              style={[styles.col2, styles.boldText, { textAlign: "right" }]}
            >
              Advance Paid
            </Text>
            <Text style={styles.col3}></Text>
            <Text style={styles.col4}></Text>
            <Text style={styles.col5}>{Number(advancePaid).toFixed(2)}</Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.col1}></Text>
            <Text
              style={[styles.col2, styles.boldText, { textAlign: "right" }]}
            >
              BILL TOTAL
            </Text>
            <Text style={styles.col3}></Text>
            <Text style={styles.col4}></Text>
            <Text style={[styles.col5, styles.boldText]}>
              {Number(balanceAmount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 5. Footer Section */}
        <View style={styles.footer}>
          <View style={styles.usersRow}>
            <Text>
              <Text style={styles.boldText}>Billed By:</Text> {billedByName}
              {billedByRole ? ` (${billedByRole})` : ""}
            </Text>
            <Text></Text>
          </View>

          <Text style={styles.disclaimer}>
            May we request you to return the room key.{"\n"}I agree that my
            liability for this bill is not waived and I agree to be held
            personally liable in the event that the indicated person, company or
            association fails to pay for any part or the full amount of these
            charges.
          </Text>

          <View style={styles.signaturesRow}>
            <Text style={styles.signatureBox}>Authorized Signature</Text>
            <Text style={styles.signatureBox}>Guest Signature</Text>
          </View>

          {/* Website QR CODE IN FOOTER */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrBox}>
                <Image 
                  style={styles.qrImage} 
                  src={WEBSITE_QR_PATH}
                />
                <Text style={styles.qrText}>Visit our Website</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default HotelInvoiceDocument;