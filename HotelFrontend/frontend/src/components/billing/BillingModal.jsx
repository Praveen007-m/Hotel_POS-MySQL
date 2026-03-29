import { DEFAULT_GST_RATES, formatIST } from "../../utils/billingUtils";
import { generateInvoicePDF } from "../../utils/invoicePdf.jsx";
import { useState, useEffect, useMemo } from "react";

const EMPTY_FORM = {
  room_price: 0,
  discount: 0,
  add_ons: [],
  kitchen_orders: [],
};

const BillingModal = ({
  open,
  onClose,
  selectedBill,
  form,
  setForm,
  gstIncluded,
  setGstIncluded,
  onGstChange,
  availableAddOns = [],
  menuItems = [],
  onDownload,
  autoView = false,
}) => {
  /* ================= GST STATE ================= */
  // Removed the complex gst state and useEffect that called the API
  // Now using DEFAULT_GST_RATES directly

  const [isOpen, setOpen] = useState(false);
  const [gstNumber, setGstNumber] = useState("");

  // when the modal opens with a new bill, prefill GST if stored
  useEffect(() => {
    if (selectedBill && selectedBill.gst_number) {
      setGstNumber(selectedBill.gst_number);
    }
  }, [selectedBill]);
  const [guestDiscount, setGuestDiscount] = useState(0);
  const safeForm = form || EMPTY_FORM;

  /* ================= CALCULATE GST RATE FOR ROOM ================= */
  // New function to determine room GST based on price
  const getRoomGstRate = (roomPrice) => {
    const price = Number(roomPrice || 0);
    return price > DEFAULT_GST_RATES.room.threshold
      ? DEFAULT_GST_RATES.room.high
      : DEFAULT_GST_RATES.room.low;
  };

  /* ================= SAFE GST ================= */
  const roomPrice = Number(safeForm.room_price || 0);
  const roomGstRate = getRoomGstRate(roomPrice);

  const safeGst = useMemo(
    () => ({
      room: roomGstRate,
      kitchen: DEFAULT_GST_RATES.kitchen,
      addon: DEFAULT_GST_RATES.addon,
    }),
    [roomGstRate],
  );

  /* ================= HELPERS ================= */
  const handleFormChange = (field, value, index, type) => {
    if (!type) {
      setForm({ ...form, [field]: value });
      return;
    }

    const key = type === "add_on" ? "add_ons" : "kitchen_orders";
    const updated = [...form[key]];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, [key]: updated });
  };

  const removeAddOn = (index) =>
    setForm({
      ...form,
      add_ons: form.add_ons.filter((_, i) => i !== index),
    });

  const addKitchenOrder = () =>
    setForm({
      ...form,
      kitchen_orders: [
        ...form.kitchen_orders,
        { item_name: "", quantity: 1, price: 0 },
      ],
    });

  const removeKitchenOrder = (index) =>
    setForm({
      ...form,
      kitchen_orders: form.kitchen_orders.filter((_, i) => i !== index),
    });

  /* ================= CALCULATIONS ================= */
  const { discountedRoom, addOnsTotal } = useMemo(() => {
    const roomCharge = Number(safeForm.room_price || 0);
    const discount = Number(safeForm.discount || 0);

    const discountedRoom = Math.max(roomCharge - discount, 0);

    const addOnsTotal = (safeForm.add_ons || []).reduce(
      (sum, a) => sum + Number(a.price || 0) * Number(a.qty || 1),
      0,
    );

    return { discountedRoom, addOnsTotal };
  }, [safeForm]);

  if (!open || !selectedBill || !form) return null;

  const subtotal = discountedRoom + addOnsTotal;

  const roomGst = gstIncluded ? discountedRoom * safeGst.room : 0;
  const addOnsGst = gstIncluded ? addOnsTotal * safeGst.addon : 0;

  const totalGst = roomGst + addOnsGst;
  const subtotalWithGst = subtotal + totalGst;
  const totalAmount = subtotalWithGst - guestDiscount;

  const advancePaid = Number(selectedBill.advance_paid || 0);
  const balanceAmount = totalAmount - advancePaid;

  const roomGstPercent = Number((safeGst.room * 100).toFixed(2));
  const addonGstPercent = Number((safeGst.addon * 100).toFixed(2));

  /* ================= AUTO VIEW EFFECT ================= */
  // Removed autoView effect to fix blank page issue.
  // Browsers block automatic print/tab opening if not direct user result.

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-auto">
      <div className="relative bg-white w-full max-w-6xl rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col xl:flex-row gap-6 my-auto">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-6 right-9 text-3xl font-light text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        {/* ================= LEFT SIDE (UNCHANGED UI) ================= */}
        <div className="flex-1 bg-gray-50 p-4 sm:p-6 rounded-xl space-y-4 overflow-auto xl:max-h-[80vh]">
          <h3 className="font-semibold text-[#0A1A2F] text-lg">Edit Bill</h3>

          {/* GST NUMBER & GUEST DISCOUNT SECTION */}
          <div className="space-y-2">
            {!isOpen && (
              <button
                onClick={() => setOpen(true)}
                className="px-3 py-1 ml-2 bg-[#0A1A2F] text-white rounded-lg text-sm"
              >
                Add Customer GST Number
              </button>
            )}

            {isOpen && (
              <div className="space-y-3 p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Customer GST Number
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm mt-1"
                    placeholder="Enter GST Number (e.g., 27AAPPU5055K1Z0)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Guest Discount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={guestDiscount}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0;
                      setGuestDiscount(Math.max(value, 0));
                    }}
                    className="w-full border rounded-lg p-2 text-sm mt-1"
                    placeholder="Enter guest discount amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Discount applied after GST
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="w-full px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-gray-200">
            {/* Room Charges */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Room Charges
              </label>
              <input
                type="number"
                value={form.room_price}
                readOnly
                className="w-full border rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Room Discount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Room Discount
              </label>
              <input
                type="number"
                min={0}
                value={form.discount}
                onChange={(e) => {
                  const value = Number(e.target.value) || 0;
                  handleFormChange(
                    "discount",
                    Math.min(value, form.room_price),
                  );
                }}
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Enter discount amount"
              />
            </div>
          </div>

          {/* GST DISPLAY */}
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-medium">GST:</label>
            <select
              value={gstIncluded ? "with" : "without"}
              onChange={(e) => {
                const isWithGst = e.target.value === "with";
                setGstIncluded(isWithGst);
                if (onGstChange)
                  onGstChange(isWithGst ? "With GST" : "Without GST");
              }}
              className="border rounded-lg p-1 text-sm"
            >
              <option value="with">With GST</option>
              <option value="without">Without GST</option>
            </select>
            {/* Display applied GST rate for room */}
            <span className="text-xs text-gray-600 ml-2">
              (Room: {roomGstPercent}%{" "}
              {roomPrice > DEFAULT_GST_RATES.room.threshold
                ? "- Above ₹7500"
                : "- Below ₹7500"}
              )
            </span>
          </div>

          {/* ADD-ONS */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add-ons</label>

            {form.add_ons.map((a, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg border border-gray-100 sm:border-none sm:p-0"
              >
                <select
                  value={a.name}
                  onChange={(e) => {
                    const selected = availableAddOns.find(
                      (x) => x.name === e.target.value,
                    );
                    const updated = [...form.add_ons];
                    updated[i] = {
                      name: selected?.name || "",
                      qty: 1,
                      price: selected?.price || 0,
                    };
                    setForm({ ...form, add_ons: updated });
                  }}
                  className="flex-1 border rounded-lg p-2 text-sm"
                >
                  <option value="">Select Add-on</option>
                  {availableAddOns.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name} — ₹{a.price}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 w-full">
                  <input
                    type="number"
                    value={a.qty}
                    onChange={(e) =>
                      handleFormChange(
                        "qty",
                        Number(e.target.value),
                        i,
                        "add_on",
                      )
                    }
                    className="w-full sm:w-16 border rounded-lg p-2 text-sm"
                    placeholder="Qty"
                  />

                  <input
                    type="number"
                    value={a.price}
                    readOnly
                    className="w-full sm:w-24 border rounded-lg p-2 bg-gray-100 text-sm"
                  />

                  <button
                    onClick={() => removeAddOn(i)}
                    className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() =>
                setForm({
                  ...form,
                  add_ons: [...form.add_ons, { name: "", qty: 1, price: 0 }],
                })
              }
              className="px-3 py-1 ml-2 bg-[#0A1A2F] text-white rounded-lg text-sm"
            >
              Add-on
            </button>
          </div>
        </div>

        {/* ================= RIGHT PREVIEW ================= */}
        <div className="flex-1 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 xl:max-h-[80vh] overflow-auto space-y-2">
          <h3 className="font-semibold text-[#0A1A2F] text-lg mb-2">
            Bill Preview
          </h3>

          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <b>Booking ID:</b> {selectedBill.booking_id}
            </p>
            <p>
              <b>Customer:</b> {selectedBill.customer_name}
            </p>
            <p className="text-xs text-gray-500">
              Customer ID: {selectedBill.customer_id}
            </p>

            {gstNumber && (
              <p>
                <b>GST Number:</b> {gstNumber}
              </p>
            )}

            <p>
              <b>Room ID:</b> {selectedBill.room_id}
            </p>
            <p>
              <b>Room Category:</b> {selectedBill.room_category || "N/A"}
            </p>
            <p>
              <b>Check-in:</b> {formatIST(selectedBill.check_in)}
            </p>
            <p>
              <b>Check-out:</b> {formatIST(selectedBill.check_out)}
            </p>

            <hr className="my-2 border-gray-200" />

            <p>
              <b>Room Charges:</b> ₹{form.room_price}
            </p>

            {form.add_ons.length > 0 && (
              <>
                <p>
                  <b>Add-ons:</b>
                </p>
                <ul className="list-disc ml-5">
                  {form.add_ons.map((a, i) => (
                    <li key={i}>
                      {a.name} × {a.qty} — ₹{a.price}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {form.discount > 0 && (
              <p>
                <b>Room Discount:</b> - ₹{form.discount}
              </p>
            )}

            <p>
              <b>Subtotal:</b> ₹{subtotal.toFixed(2)}
            </p>

            {gstIncluded && (
              <>
                <p>
                  <b>Room GST ({roomGstPercent}%):</b> ₹{roomGst.toFixed(2)}
                </p>

                <p>
                  <b>Add-ons GST ({addonGstPercent}%):</b> ₹
                  {addOnsGst.toFixed(2)}
                </p>
              </>
            )}

            <p>
              <b>Subtotal with GST:</b> ₹{subtotalWithGst.toFixed(2)}
            </p>

            {guestDiscount > 0 && (
              <p>
                <b>Guest Discount:</b> - ₹{guestDiscount.toFixed(2)}
              </p>
            )}

            <hr className="my-2 border-gray-300" />

            <p className="flex justify-between">
              <span>
                <b>Total Amount:</b>
              </span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </p>

            <p className="flex justify-between text-green-600 font-medium">
              <span>
                <b>Advance Paid:</b>
              </span>
              <span>- ₹{advancePaid.toFixed(2)}</span>
            </p>

            <hr className="my-2 border-gray-300" />

            <p className="flex justify-between text-lg font-bold text-red-600">
              <span>Balance Amount:</span>
              <span>₹{balanceAmount.toFixed(2)}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            <button
              onClick={() => {
                generateInvoicePDF({
                  selectedBill,
                  form,
                  gstIncluded,
                  gstNumber,
                  guestDiscount,
                  gstRates: {
                    room: safeGst.room,
                    kitchen: safeGst.kitchen,
                    addon: safeGst.addon,
                  },
                  gstAmounts: {
                    room: roomGst,
                    kitchen: 0,
                    addon: addOnsGst,
                  },
                  subtotal,
                  subtotalWithGst,
                  totalAmount,
                  advancePaid,
                  balanceAmount,
                  formatIST,
                  action: "download", // Direct Download
                });
                const billId = selectedBill.bill_id || selectedBill.id;
                if (onDownload && billId) {
                  onDownload(billId, gstNumber || "");
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#0A1A2F] hover:bg-[#14273F] text-white rounded-lg font-medium text-sm transition-all active:scale-95"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download PDF File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;
