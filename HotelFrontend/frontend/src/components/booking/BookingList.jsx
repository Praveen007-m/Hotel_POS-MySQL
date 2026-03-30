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
  onStatusUpdate, // Renamed from onCheckoutSave
}) {
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutData, setCheckoutData] = useState({});
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  // REMOVED: newAddon state (manual addon inputs)
  const [selectedAddonId, setSelectedAddonId] = useState("");


  const navigate = useNavigate();

  /* ===================== HELPERS ===================== */
  const normalize = (str) => str.toLowerCase().replace(/\s+/g, "_");

  const parseAddOns = (addOns) => {
    if (!addOns) return [];

    // Case 1: already array
    if (Array.isArray(addOns)) {
      return addOns.map((a) => {
        // normalize object → string
        if (typeof a === "object" && a !== null) {
          return a.description || a.label || "";
        }
        return a;
      });
    }

    // Case 2: JSON string
    if (typeof addOns === "string") {
      try {
        const parsed = JSON.parse(addOns);
        if (!Array.isArray(parsed)) return [];

        return parsed.map((a) => {
          if (typeof a === "object" && a !== null) {
            return a.description || a.label || "";
          }
          return a;
        });
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

  /* ===================== FETCH ADD-ONS ===================== */
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

  /* ===================== CHECKOUT ===================== */
  const openCheckoutById = async (id) => {
    try {
      const res = await auth.get(`/bookings/${id}`);
      const booking = res.data;
      await openCheckout(booking);
    } catch (err) {
      toast.error("Failed to load booking for checkout");
    }
  };

  const openCheckout = async (booking) => {
    if (!availableAddons.length) {
      toast.warning("Add-ons are still loading");
      return;
    }

    const bookingAddons = parseAddOns(booking.add_ons);
    const addons = {};
    bookingAddons.forEach((name) => {
      const addon = availableAddons.find((a) => a.name === name);

      addons[name] = {
        label: name,
        price: addon ? Number(addon.price) : 0,
        selected: true,
      };
    });

    let kitchenData = [];
    try {
      const res = await auth.get(`/kitchen/orders?booking_id=${booking.id}`);
      kitchenData = res.data;
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch kitchen orders");
    }

    const checkInDate = new Date(booking.check_in);
    const checkOutDate = new Date(booking.check_out);

    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    const stayDays = Math.max(
      Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
      1,
    );

    const roomTotal = booking.price * stayDays;
    const advancePaid = Number(booking.advance_paid || 0);
    const addonsArray = Object.values(addons || {});

    const addOnsTotal = addonsArray.reduce(
      (sum, a) => sum + (a.selected ? Number(a.price || 0) : 0),
      0,
    );

    const kitchenTotal = kitchenData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    setKitchenOrders(kitchenData);
    setCheckoutBooking(booking);
    const totalAmount = roomTotal + addOnsTotal + kitchenTotal;
    const balanceAmount = totalAmount - advancePaid;

    setCheckoutData({
      check_out: new Date().toISOString().slice(0, 16),
      price: roomTotal,
      stayDays,
      add_ons: addons,
      addOnsTotal,
      kitchenTotal,
      totalAmount,
      advancePaid,
      balanceAmount,
      status: booking.status,
      gstNumber: booking.gst_number || "",
    });
  };


  const handleAddonSelect = (e) => {
    const addonId = e.target.value;
    if (!addonId) return;

    const addon = availableAddons.find(a => a.id == addonId);
    if (!addon) return;

    const key = normalize(addon.name);
    if (checkoutData.add_ons[key]) {
      toast.error("Addon already selected");
      setSelectedAddonId("");
      return;
    }

    const updatedAddons = {
      ...checkoutData.add_ons,
      [key]: {
        label: addon.name,
        price: Number(addon.price),
        selected: true,
      },
    };

    const addOnsTotal = Object.values(updatedAddons).reduce(
      (sum, a) => sum + (a.selected ? a.price : 0),
      0,
    );

    setCheckoutData((prev) => {
      const totalAmount = prev.price + addOnsTotal + prev.kitchenTotal;
      const balanceAmount = totalAmount - (prev.advancePaid || 0);
      return {
        ...prev,
        add_ons: updatedAddons,
        addOnsTotal,
        totalAmount,
        balanceAmount,
      };
    });

    setSelectedAddonId("");
    toast.success(`${addon.name} added`);
  };

  const toggleAddon = (key) => {
    const updated = {
      ...checkoutData.add_ons,
      [key]: {
        ...checkoutData.add_ons[key],
        selected: !checkoutData.add_ons[key].selected,
      },
    };

    const addOnsTotal = Object.values(updated).reduce(
      (sum, a) => sum + (a.selected ? a.price : 0),
      0,
    );

    setCheckoutData((prev) => {
      const totalAmount = prev.price + addOnsTotal + prev.kitchenTotal;
      const balanceAmount = totalAmount - (prev.advancePaid || 0);

      return {
        ...prev,
        add_ons: updated,
        addOnsTotal,
        totalAmount,
        balanceAmount,
      };
    });
  };

  const confirmCheckout = async () => {
    try {
      const finalAddOns = Object.values(checkoutData.add_ons)
        .filter((a) => a.selected)
.map((a) => ({
    name: a.label,
    price: a.price,
  }));

console.log('Sending add_ons:', finalAddOns);
console.log('Total amount:', checkoutData.totalAmount);

      await auth.post(`/bookings/${checkoutBooking.id}/checkout`, {
        check_out: checkoutData.check_out,
        add_ons: finalAddOns,
        kitchen_orders: kitchenOrders,
        total_amount: checkoutData.totalAmount,
        gst_number: checkoutData.gstNumber || undefined,
      });

      toast.success("Checkout completed & bill generated");
      onDelete(checkoutBooking.id);
      setCheckoutBooking(null);
      setCheckoutData({});
      setKitchenOrders([]);
      navigate("/billing")
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed: " + (err.response?.data?.error || err.message));
    }
  };


  /* ===================== UI ===================== */
  if (loading) return <LoadingSpinner />;

  if (!bookings?.length)
    return (
      <div className="text-center text-gray-500 mt-20">
        <p className="text-xl font-medium">No bookings found</p>
      </div>
    );

  const handleStatusChange = async (id, newStatus) => {
    // Prevent checkout unless checked-in
    const booking = bookings.find(b => b.id === id);
    if (newStatus === 'Checked-out' && booking.status?.toLowerCase() !== 'checked-in') {
      toast.error('Cannot checkout - booking must be Checked-in first');
      return;
    }

    // Checkout flow
    if (newStatus === 'Checked-out') {
      openCheckoutById(id);
      return;
    }

    // Simple status update
    try {
      setStatusUpdatingId(id);
      toast.info(`Updating status to ${newStatus}...`);
      await onStatusUpdate(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Status update failed');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <>

      <BookingTable
        bookings={bookings}
        parseAddOns={parseAddOns}
        formatDate={formatDate}
        onDelete={onDelete}
        onStatusChange={handleStatusChange}
      />


      {/* ===================== CHECKOUT MODAL ===================== */}
      {checkoutBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-4">
              Final Checkout - Generate Bill & Settle Orders
            </h3>

            <p className="text-sm text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              This will generate final bill (room + kitchen + GST), mark all kitchen orders as "Settled", and complete checkout.
            </p>

            <p className="mb-2">
              Room: ₹{checkoutBooking.price} × {checkoutData.stayDays} nights = ₹{checkoutData.price}
            </p>

            {/* GST */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">GST Number (optional)</label>
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

            {/* ================= ADDONS ================= */}
            <p className="font-medium mb-2">Add-ons:</p>

            {/* Selected addons with remove ❌ */}
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(checkoutData.add_ons || {})
                .filter(([, v]) => v.selected)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm shadow-sm hover:bg-blue-200 transition-all group"
                  >
                    <span>{v.label} (₹{v.price})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAddon(k);
                      }}
                      className="ml-1 text-red-500 hover:text-red-700 group-hover:scale-110 transition-transform"
                      title="Remove"
                    >
                      ❌
                    </button>
                  </div>
                ))}
            </div>

            {/* 🔥 ADDON DROPDOWN */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Select Add-on</label>
              <select
                value={selectedAddonId}
                onChange={handleAddonSelect}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose add-on --</option>
                {availableAddons.map((addon) => {
                  const key = normalize(addon.name);
                  const exists = checkoutData.add_ons[key];
                  return (
                    <option 
                      key={addon.id} 
                      value={addon.id}
                      disabled={exists}
                    >
                      {addon.name} (₹{addon.price})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* ================= KITCHEN ================= */}
            {kitchenOrders.length > 0 && (
              <>
                <p className="font-medium mb-2 mt-4">Kitchen Orders:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {kitchenOrders.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded bg-green-100 text-green-800 text-sm"
                    >
                      {item.item_name} × {item.quantity} (₹
                      {item.price * item.quantity})
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* TOTAL */}
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold">Total: ₹{checkoutData.totalAmount}</p>
              <p className="text-sm text-green-600">
                Advance Paid: ₹{checkoutData.advancePaid || 0}
              </p>
              <p className="text-lg font-bold text-red-600">
                Balance Amount: ₹{checkoutData.balanceAmount}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setCheckoutBooking(null)}
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
