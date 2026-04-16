import { useState, useEffect } from "react";
import auth from "../../auth/axiosInstance";
import { useNavigate } from "react-router-dom";
import BookingTable from "./BookingTable";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { toast } from "react-toastify";

export default function BookingList({
  bookings,
  loading,
  onDelete,
  onStatusUpdate,
}) {
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutData, setCheckoutData] = useState({});
  const [availableAddons, setAvailableAddons] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selectedAddonId, setSelectedAddonId] = useState("");
  const [kitchenTotal, setKitchenTotal] = useState(0);
  const [addonTotal, setAddonTotal] = useState(0);

  const navigate = useNavigate();

  const normalize = (str) => String(str || "").toLowerCase().replace(/\s+/g, "_");

  const parseAddOns = (addOns) => {
    if (!addOns) return [];
    if (Array.isArray(addOns)) {
      return addOns.map((a) =>
        typeof a === "object" && a !== null ? a.description || a.label || a.name || "" : a
      );
    }
    if (typeof addOns === "string") {
      try {
        const parsed = JSON.parse(addOns);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((a) =>
          typeof a === "object" && a !== null ? a.description || a.label || a.name || "" : a
        );
      } catch {
        return [];
      }
    }
    return [];
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

  const recomputeTotals = (price, stayDays, addons, currentKitchenTotal = 0) => {
    const roomSubtotal = Number(price || 0) * Number(stayDays || 1);
    const kitchenSubtotal = Number(currentKitchenTotal || 0);
    const addonSubtotal = Object.values(addons || {}).reduce(
      (sum, addon) => sum + (addon.selected && addon.price ? Number(addon.price) : 0),
      0
    );

    // GST Calculation logic matching backend (billingUtils)
    const calculateGST = (amount, type) => {
      let rate = 0.05; // 5% default
      if (type === "room" && amount / (stayDays || 1) > 7500) {
        rate = 0.18; // 18% for high-value rooms
      }
      return Number((amount * rate).toFixed(2));
    };

    const roomGst = calculateGST(roomSubtotal, "room");
    const kitchenGst = calculateGST(kitchenSubtotal, "kitchen");
    const addonGst = calculateGST(addonSubtotal, "addon");

    const subtotal = roomSubtotal + kitchenSubtotal + addonSubtotal;
    const gstTotal = roomGst + kitchenGst + addonGst;
    const totalAmount = Number((subtotal + gstTotal).toFixed(2));

    return { 
      roomTotal: roomSubtotal, 
      roomGst,
      kitchenTotal: kitchenSubtotal,
      kitchenGst,
      addonTotal: addonSubtotal, 
      addonGst,
      gstTotal,
      subtotal,
      totalAmount 
    };
  };

  const buildAddonMap = (booking, previewAddOns = []) => {
    const addons = {};

    previewAddOns.forEach((addon) => {
      const key = normalize(addon.name);
      addons[key] = {
        label: addon.name,
        price: Number(addon.price || 0),
        selected: true,
      };
    });

    parseAddOns(booking.add_ons).forEach((name) => {
      const addon = availableAddons.find((item) => item.name === name);
      const key = normalize(name);
      if (!addons[key]) {
        addons[key] = {
          label: name,
          price: Number(addon?.price || 0),
          selected: true,
        };
      }
    });

    return addons;
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const res = await auth.get(`/addons`);
      setAvailableAddons(res.data || []);
    } catch (err) {
      console.error("Failed to fetch add-ons", err);
    }
  };

  const openCheckoutById = async (id) => {
    try {
      const res = await auth.get(`/bookings/${id}`);
      await openCheckout(res.data);
    } catch {
      toast.error("Failed to load booking for checkout");
    }
  };

  const openCheckout = async (booking) => {
    const d1 = new Date(booking.check_in);
    const d2 = new Date(booking.check_out);
    // Standard hotel night calculation (check-out date - check-in date)
    const msPerDay = 1000 * 60 * 60 * 24;
    const stayDays = Math.max(
      Math.round((new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()) - 
                  new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())) / msPerDay),
      1
    );

    const roomPrice = Number(booking.price || 0);
    const roomTotal = roomPrice * stayDays;
    const advancePaid = Number(booking.advance_paid || 0);

    let preview = null;
    try {
      const previewRes = await auth.get(`/billings/preview/${booking.booking_id}`);
      preview = previewRes.data;
    } catch (err) {
      console.error("Failed to load billing preview", err);
    }

    const addons = buildAddonMap(booking, preview?.add_ons || []);
    const nextKitchenTotal = Number(preview?.kitchenTotal || preview?.kitchen_total || 0);
    const {
      roomTotal: nextRoomTotal,
      roomGst,
      kitchenTotal: nextKitchenTotalReturn,
      kitchenGst,
      addonTotal: nextAddonTotal,
      addonGst,
      gstTotal,
      subtotal,
      totalAmount,
    } = recomputeTotals(roomPrice, stayDays, addons, nextKitchenTotal);

    setKitchenTotal(nextKitchenTotal);
    setAddonTotal(nextAddonTotal);
    setCheckoutBooking(booking);
    setCheckoutData({
      check_out: new Date().toISOString().slice(0, 16),
      roomPrice,
      price: roomTotal,
      stayDays,
      add_ons: addons,
      kitchenTotal: nextKitchenTotal,
      addonTotal: nextAddonTotal,
      roomTotal: nextRoomTotal,
      roomGst,
      kitchenTotalReturn: nextKitchenTotalReturn,
      kitchenGst,
      addonGst,
      subtotal,
      gstTotal,
      totalAmount,
      advancePaid: Number(preview?.advancePaid || preview?.advance_paid || advancePaid),
      balanceAmount: totalAmount - Number(booking.discount || 0) - Number(preview?.advancePaid || preview?.advance_paid || advancePaid),
      status: booking.status,
      gstNumber: booking.gst_number || "",
      discount: Number(booking.discount || 0),
    });
  };

  const handleAddonSelect = (e) => {
    const currentAddonId = e.target.value;
    if (!currentAddonId) return;

    const addon = availableAddons.find((item) => item.id == currentAddonId);
    if (!addon) return;

    const key = normalize(addon.name);
    if (checkoutData.add_ons?.[key]) {
      toast.error("Addon already selected");
      setSelectedAddonId("");
      return;
    }

    const updatedAddons = {
      ...checkoutData.add_ons,
      [key]: { label: addon.name, price: Number(addon.price), selected: true },
    };

        const { 
      roomTotal, 
      roomGst, 
      kitchenTotal: kTotal, 
      kitchenGst, 
      addonTotal: nextAddonTotal, 
      addonGst,
      subtotal,
      gstTotal, 
      totalAmount 
    } = recomputeTotals(checkoutData.roomPrice, checkoutData.stayDays, updatedAddons, kitchenTotal); 
    
    setAddonTotal(nextAddonTotal); 
    setCheckoutData((prev) => ({ 
      ...prev, 
      add_ons: updatedAddons, 
      addonTotal: nextAddonTotal, 
      roomTotal,
      roomGst,
      kitchenTotalReturn: kTotal,
      kitchenGst,
      addonGst,
      subtotal,
      gstTotal, 
      totalAmount, 
      balanceAmount: totalAmount - Number(prev.discount || 0) - Number(prev.advancePaid || 0), 
    }));


    setSelectedAddonId("");
    toast.success(`${addon.name} added`);
  };

  const toggleAddon = (key) => {
    const updatedAddons = {
      ...checkoutData.add_ons,
      [key]: {
        ...checkoutData.add_ons[key],
        selected: !checkoutData.add_ons[key].selected,
      },
    };

        const { 
      roomTotal, 
      roomGst, 
      kitchenTotal: kTotal, 
      kitchenGst, 
      addonTotal: nextAddonTotal, 
      addonGst,
      subtotal,
      gstTotal, 
      totalAmount 
    } = recomputeTotals(checkoutData.roomPrice, checkoutData.stayDays, updatedAddons, kitchenTotal); 
    
    setAddonTotal(nextAddonTotal); 
    setCheckoutData((prev) => ({ 
      ...prev, 
      add_ons: updatedAddons, 
      addonTotal: nextAddonTotal, 
      roomTotal,
      roomGst,
      kitchenTotalReturn: kTotal,
      kitchenGst,
      addonGst,
      subtotal,
      gstTotal, 
      totalAmount, 
      balanceAmount: totalAmount - Number(prev.discount || 0) - Number(prev.advancePaid || 0), 
    }));

  };

  const confirmCheckout = async () => {
    try {
      const finalAddOns = Object.values(checkoutData.add_ons || {})
        .filter((addon) => addon.selected)
        .map((addon) => ({ name: addon.label, price: addon.price }));

      const { addonTotal: nextAddonTotal, totalAmount } = recomputeTotals(
        checkoutData.roomPrice,
        checkoutData.stayDays,
        checkoutData.add_ons,
        kitchenTotal
      );

      await auth.post(`/bookings/${checkoutBooking.id}/checkout`, {
        check_out: checkoutData.check_out,
        add_ons: finalAddOns,
        total_amount: checkoutData.totalAmount,
        discount: Number(checkoutData.discount || 0),
        gst_number: checkoutData.gstNumber || undefined,
      });

      setAddonTotal(nextAddonTotal);
      toast.success("Checkout completed & bill generated");
      onDelete(checkoutBooking.id);
      setCheckoutBooking(null);
      setCheckoutData({});
      setKitchenTotal(0);
      setAddonTotal(0);
      navigate("/billing");
    } catch (err) {
      console.error(err);
      toast.error(
        "Checkout failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const booking = bookings.find((b) => b.id === id);
    if (
      newStatus === "Checked-out" &&
      booking.status?.toLowerCase() !== "checked-in"
    ) {
      toast.error("Cannot checkout - booking must be Checked-in first");
      return;
    }

    if (newStatus === "Checked-out") {
      openCheckoutById(id);
      return;
    }

    try {
      setStatusUpdatingId(id);
      toast.info(`Updating status to ${newStatus}...`);
      await onStatusUpdate(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Status update failed");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!bookings?.length) {
    return (
      <div className="text-center text-gray-500 mt-20">
        <p className="text-xl font-medium">No bookings found</p>
      </div>
    );
  }

  return (
    <>
      <BookingTable
        bookings={bookings}
        parseAddOns={parseAddOns}
        formatDate={formatDate}
        onDelete={onDelete}
        onStatusChange={handleStatusChange}
      />

      {checkoutBooking && (
        <div className="fixed inset-0 bg-black/40 flex justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full my-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Final Checkout - Generate Bill & Settle Orders
            </h3>

            <p className="text-sm text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              This will generate the final bill with room, kitchen, and selected add-ons.
            </p>

            <p className="mb-2">
              Room: ₹{checkoutData.roomPrice} × {checkoutData.stayDays} nights = ₹{checkoutData.price}
            </p>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                GST Number (optional)
              </label>
              <input
                type="text"
                value={checkoutData.gstNumber || ""}
                onChange={(e) =>
                  setCheckoutData((prev) => ({
                    ...prev,
                    gstNumber: e.target.value,
                  }))
                }
                placeholder="GSTIN"
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={checkoutData.discount || 0}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setCheckoutData((prev) => {
                    const nextAddons = { ...prev.add_ons };
                    const { 
                      roomTotal, 
                      roomGst, 
                      kitchenTotal: kTotal, 
                      kitchenGst, 
                      addonTotal: nextAddonTotal, 
                      addonGst,
                      subtotal,
                      gstTotal, 
                      totalAmount 
                    } = recomputeTotals(
                      prev.roomPrice,
                      prev.stayDays,
                      nextAddons,
                      kitchenTotal
                    );
                    return {
                      ...prev,
                      discount: val,
                      roomTotal,
                      roomGst,
                      kitchenTotalReturn: kTotal,
                      kitchenGst,
                      addonGst,
                      subtotal,
                      gstTotal,
                      totalAmount,
                      balanceAmount: totalAmount - val - Number(prev.advancePaid || 0),
                    };
                  });
                }}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <p className="font-medium mb-2">Add-ons:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(checkoutData.add_ons || {})
                .filter(([, value]) => value.selected)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm shadow-sm hover:bg-blue-200 transition-all group"
                  >
                    <span>
                      {value.label} (₹{value.price})
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAddon(key);
                      }}
                      className="ml-1 text-red-500 hover:text-red-700 group-hover:scale-110 transition-transform"
                      title="Remove"
                    >
                      x
                    </button>
                  </div>
                ))}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Select Add-on
              </label>
              <select
                value={selectedAddonId}
                onChange={handleAddonSelect}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose add-on --</option>
                {availableAddons.map((addon) => {
                  const key = normalize(addon.name);
                  const exists = checkoutData.add_ons?.[key];
                  return (
                    <option key={addon.id} value={addon.id} disabled={!!exists}>
                      {addon.name} (₹{addon.price})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-800 mb-3">Bill Summary</h3>
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Room Charges:</span>
                <span className="font-medium">₹{Number(checkoutData.roomTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 italic">Room GST:</span>
                <span className="text-gray-500 font-medium text-[10px]">₹{Number(checkoutData.roomGst || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Kitchen Charges:</span>
                <span className="font-medium">₹{Number(checkoutData.kitchenTotalReturn || checkoutData.kitchenTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 italic">Kitchen GST:</span>
                <span className="text-gray-500 font-medium text-[10px]">₹{Number(checkoutData.kitchenGst || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Add-on Charges:</span>
                <span className="font-medium">₹{Number(checkoutData.addonTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 italic">Add-on GST:</span>
                <span className="text-gray-500 font-medium text-[10px]">₹{Number(checkoutData.addonGst || 0).toFixed(2)}</span>
              </div>

              <hr className="border-blue-100 my-2" />

              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal (Charges + GST):</span>
                <span className="font-medium">₹{Number(checkoutData.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span className="text-gray-700">Discount:</span>
                <span className="font-medium">- ₹{Number(checkoutData.discount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Advance Paid:</span>
                <span>- ₹{Number(checkoutData.advancePaid || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-red-600">
                <span>Balance Payable:</span>
                <span className="text-lg">₹{Number(checkoutData.balanceAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setCheckoutBooking(null);
                  setCheckoutData({});
                  setKitchenTotal(0);
                  setAddonTotal(0);
                }}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckout}
                className="bg-[#0A1B4D] text-white px-4 py-2 rounded"
              >
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
