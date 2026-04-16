import { DEFAULT_GST_RATES, formatIST } from "../../utils/billingUtils";
import { generateInvoicePDF } from "../../utils/invoicePdf.jsx";
import { useState, useEffect, useMemo } from "react";

const EMPTY_FORM = {
  discount: 0,
  add_ons: [],
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
  onDownload,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [guestDiscount, setGuestDiscount] = useState(0);

  useEffect(() => {
    if (selectedBill?.gst_number) {
      setGstNumber(selectedBill.gst_number);
    }
  }, [selectedBill]);

  const safeForm = form || EMPTY_FORM;

  const getRoomGstRate = (roomPrice) => {
    const price = Number(roomPrice || 0);
    return price > DEFAULT_GST_RATES.room.threshold
      ? DEFAULT_GST_RATES.room.high
      : DEFAULT_GST_RATES.room.low;
  };

  const {
    roomCharges,
    kitchenCharges,
    backendAddOnsTotal,
    newAddOnsTotal,
    addOnsTotal,
    discountedRoom,
    roomGstRate,
  } = useMemo(() => {
    if (!selectedBill) {
      return {
        roomCharges: 0,
        kitchenCharges: 0,
        backendAddOnsTotal: 0,
        newAddOnsTotal: 0,
        addOnsTotal: 0,
        discountedRoom: 0,
        roomGstRate: DEFAULT_GST_RATES.room.low,
      };
    }

    const roomCharges = (selectedBill.lines?.room ?? []).reduce(
      (sum, item) => sum + Number(item?.total || 0),
      0
    );

    const kitchenCharges = (selectedBill.lines?.kitchen ?? []).reduce(
      (sum, item) => sum + Number(item?.total || 0),
      0
    );

    const backendAddOnsTotal = (selectedBill.lines?.addon ?? []).reduce(
      (sum, item) => sum + Number(item?.total || 0),
      0
    );

    const newAddOnsTotal = (safeForm.add_ons ?? []).reduce(
      (sum, addon) =>
        sum + Number(addon.price || 0) * Number(addon.qty || 1),
      0
    );

    const addOnsTotal = backendAddOnsTotal + newAddOnsTotal;
    const discount = Number(safeForm.discount || 0);
    const discountedRoom = Math.max(roomCharges - discount, 0);
    const roomGstRate = getRoomGstRate(roomCharges);

    return {
      roomCharges,
      kitchenCharges,
      backendAddOnsTotal,
      newAddOnsTotal,
      addOnsTotal,
      discountedRoom,
      roomGstRate,
    };
  }, [selectedBill, safeForm]);

  if (!open || !selectedBill || !form) return null;

  const safeGst = {
    room: roomGstRate,
    kitchen: DEFAULT_GST_RATES.kitchen,
    addon: DEFAULT_GST_RATES.addon,
  };

  const subtotal = discountedRoom + kitchenCharges + addOnsTotal;
  const roomGst = gstIncluded ? discountedRoom * safeGst.room : 0;
  const kitchenGst = gstIncluded ? kitchenCharges * safeGst.kitchen : 0;
  const addOnsGst = gstIncluded ? addOnsTotal * safeGst.addon : 0;
  const totalGst = roomGst + kitchenGst + addOnsGst;
  const subtotalWithGst = subtotal + totalGst;
  const totalAmount = subtotalWithGst - guestDiscount;

  const advancePaid = Number(selectedBill.advance_paid || 0);
  const balanceAmount = totalAmount - advancePaid;

  const roomGstPercent = Number((safeGst.room * 100).toFixed(2));
  const kitchenGstPercent = Number((safeGst.kitchen * 100).toFixed(2));
  const addonGstPercent = Number((safeGst.addon * 100).toFixed(2));

  const handleFormChange = (field, value, index, type) => {
    if (!type) {
      setForm({ ...form, [field]: value });
      return;
    }

    const updated = [...form.add_ons];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, add_ons: updated });
  };

  const removeAddOn = (index) =>
    setForm({ ...form, add_ons: form.add_ons.filter((_, i) => i !== index) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-auto">
      <div className="relative bg-white w-full max-w-6xl rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col xl:flex-row gap-6 my-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-9 text-3xl font-light text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <div className="flex-1 bg-gray-50 p-4 sm:p-6 rounded-xl space-y-4 overflow-auto xl:max-h-[80vh]">
          <h3 className="font-semibold text-[#0A1A2F] text-lg">Edit Bill</h3>

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
                    placeholder="Enter GST Number"
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
                    onChange={(e) =>
                      setGuestDiscount(Math.max(Number(e.target.value) || 0, 0))
                    }
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Room Charges
              </label>
              <input
                type="number"
                value={roomCharges}
                readOnly
                className="w-full border rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Room Discount
              </label>
              <input
                type="number"
                min={0}
                value={safeForm.discount}
                onChange={(e) => {
                  const value = Number(e.target.value) || 0;
                  handleFormChange("discount", Math.min(value, roomCharges));
                }}
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="Enter discount amount"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-medium">GST:</label>
            <select
              value={gstIncluded ? "with" : "without"}
              onChange={(e) => {
                const isWithGst = e.target.value === "with";
                setGstIncluded(isWithGst);
                if (onGstChange) onGstChange(isWithGst ? "With GST" : "Without GST");
              }}
              className="border rounded-lg p-1 text-sm"
            >
              <option value="with">With GST</option>
              <option value="without">Without GST</option>
            </select>
            <span className="text-xs text-gray-600 ml-2">
              (Room: {roomGstPercent}%{" "}
              {roomCharges > DEFAULT_GST_RATES.room.threshold ? "- Above Rs7500" : "- Below Rs7500"})
            </span>
          </div>

          {(selectedBill.lines?.addon ?? []).length > 0 && (
            <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Saved Add-ons (from booking)
              </label>
              {selectedBill.lines.addon.map((addon, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-600">
                  <span>{addon.description ?? `Add-on ${index + 1}`}</span>
                  <span>Rs{Number(addon.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Add New Add-ons</label>
            {safeForm.add_ons.map((addon, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg border border-gray-100 sm:border-none sm:p-0"
              >
                <select
                  value={addon.name}
                  onChange={(e) => {
                    const selected = availableAddOns.find((item) => item.name === e.target.value);
                    const updated = [...safeForm.add_ons];
                    updated[index] = {
                      name: selected?.name || "",
                      qty: 1,
                      price: selected?.price || 0,
                    };
                    setForm({ ...form, add_ons: updated });
                  }}
                  className="flex-1 border rounded-lg p-2 text-sm"
                >
                  <option value="">Select Add-on</option>
                  {availableAddOns.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name} - Rs{option.price}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 w-full">
                  <input
                    type="number"
                    value={addon.qty}
                    onChange={(e) =>
                      handleFormChange("qty", Number(e.target.value), index, "add_on")
                    }
                    className="w-full sm:w-16 border rounded-lg p-2 text-sm"
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    value={addon.price}
                    readOnly
                    className="w-full sm:w-24 border rounded-lg p-2 bg-gray-100 text-sm"
                  />
                  <button
                    onClick={() => removeAddOn(index)}
                    className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                setForm({
                  ...form,
                  add_ons: [...safeForm.add_ons, { name: "", qty: 1, price: 0 }],
                })
              }
              className="px-3 py-1 ml-2 bg-[#0A1A2F] text-white rounded-lg text-sm"
            >
              Add-on
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 xl:max-h-[80vh] overflow-auto space-y-2">
          <h3 className="font-semibold text-[#0A1A2F] text-lg mb-2">Bill Preview</h3>

          <div className="text-sm text-gray-700 space-y-1">
            <p><b>Booking ID:</b> {selectedBill.booking_id}</p>
            <p><b>Customer:</b> {selectedBill.customer_name}</p>
            <p className="text-xs text-gray-500">Customer ID: {selectedBill.customer_id}</p>
            {gstNumber && <p><b>GST Number:</b> {gstNumber}</p>}
            <p><b>Room:</b> {selectedBill.room_number || "N/A"}</p>
            <p><b>Room Category:</b> {selectedBill.category || "N/A"}</p>
            <p><b>Check-in:</b> {formatIST(selectedBill.check_in)}</p>
            <p><b>Check-out:</b> {formatIST(selectedBill.check_out)}</p>

            <hr className="my-2 border-gray-200" />

            <p><b>Room Charges:</b> Rs{roomCharges.toFixed(2)}</p>
            <p><b>Kitchen Charges:</b> Rs{kitchenCharges.toFixed(2)}</p>

            {safeForm.discount > 0 && (
              <p><b>Room Discount:</b> - Rs{Number(safeForm.discount).toFixed(2)}</p>
            )}

            {backendAddOnsTotal > 0 && (
              <p><b>Add-ons (saved):</b> Rs{backendAddOnsTotal.toFixed(2)}</p>
            )}

            {safeForm.add_ons.length > 0 && (
              <>
                <p><b>New Add-ons:</b></p>
                <ul className="list-disc ml-5">
                  {safeForm.add_ons.map((addon, index) => (
                    <li key={index}>
                      {addon.name} x {addon.qty} - Rs{addon.price}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p><b>Subtotal:</b> Rs{subtotal.toFixed(2)}</p>

            {gstIncluded && (
              <>
                <p><b>Room GST ({roomGstPercent}%):</b> Rs{roomGst.toFixed(2)}</p>
                <p><b>Kitchen GST ({kitchenGstPercent}%):</b> Rs{kitchenGst.toFixed(2)}</p>
                <p><b>Add-ons GST ({addonGstPercent}%):</b> Rs{addOnsGst.toFixed(2)}</p>
              </>
            )}

            <p><b>Subtotal with GST:</b> Rs{subtotalWithGst.toFixed(2)}</p>

            {guestDiscount > 0 && (
              <p><b>Guest Discount:</b> - Rs{guestDiscount.toFixed(2)}</p>
            )}

            <hr className="my-2 border-gray-300" />

            <p className="flex justify-between">
              <span><b>Total Amount:</b></span>
              <span>Rs{totalAmount.toFixed(2)}</span>
            </p>

            <p className="flex justify-between text-green-600 font-medium">
              <span><b>Advance Paid:</b></span>
              <span>- Rs{advancePaid.toFixed(2)}</span>
            </p>

            <hr className="my-2 border-gray-300" />

            <p className="flex justify-between text-lg font-bold text-red-600">
              <span>Balance Amount:</span>
              <span>Rs{balanceAmount.toFixed(2)}</span>
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
                    kitchen: kitchenGst,
                    addon: addOnsGst,
                  },
                  subtotal,
                  subtotalWithGst,
                  totalAmount,
                  advancePaid,
                  balanceAmount,
                  formatIST,
                  action: "download",
                });
                const billId = selectedBill.id;
                if (onDownload && billId) {
                  onDownload(billId, gstNumber || "");
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-2 bg-[#0A1A2F] hover:bg-[#14273F] text-white rounded-lg font-medium text-sm transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
