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
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selectedAddonId, setSelectedAddonId] = useState("");

  const navigate = useNavigate();

  /* ─── HELPERS ─────────────────────────────────────────────────── */
  const normalize = (str) => str.toLowerCase().replace(/\s+/g, "_");

  const parseAddOns = (addOns) => {
    if (!addOns) return [];
    if (Array.isArray(addOns)) {
      return addOns.map((a) =>
        typeof a === "object" && a !== null ? a.description || a.label || "" : a
      );
    }
    if (typeof addOns === "string") {
      try {
        const parsed = JSON.parse(addOns);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((a) =>
          typeof a === "object" && a !== null ? a.description || a.label || "" : a
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

  /* ─── FIX: canonical total recalculator ───────────────────────
   * Mirrors exactly what the backend checkoutService computes:
   *   expectedTotal = roomTotal + kitchenTotal + newAddonTotal
   * No GST, no discounts — those are applied later in BillingModal.
   * ──────────────────────────────────────────────────────────── */
  const recomputeTotals = (price, stayDays, addons, kitchen) => {
    const roomTotal = Number(price || 0) * Number(stayDays || 1);

    const addOnsTotal = Object.values(addons || {}).reduce(
      (sum, a) => sum + (a.selected ? Number(a.price || 0) : 0),
      0
    );

    const kitchenTotal = (kitchen || []).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    const totalAmount = roomTotal + addOnsTotal + kitchenTotal;
    return { addOnsTotal, kitchenTotal, totalAmount };
  };

  /* ─── FETCH ADD-ONS ───────────────────────────────────────────── */
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

  /* ─── CHECKOUT OPEN ───────────────────────────────────────────── */
  const openCheckoutById = async (id) => {
    try {
      const res = await auth.get(`/bookings/${id}`);
      await openCheckout(res.data);
    } catch (err) {
      toast.error("Failed to load booking for checkout");
    }
  };

  const openCheckout = async (booking) => {
    if (!availableAddons.length) {
      toast.warning("Add-ons are still loading");
      return;
    }

    // Build addons map from booking's saved add-ons
    const bookingAddons = parseAddOns(booking.add_ons);
    const addons = {};
    bookingAddons.forEach((name) => {
      const addon = availableAddons.find((a) => a.name === name);
      const key = normalize(name);
      addons[key] = {
        label: name,
        price: addon ? Number(addon.price) : 0,
        selected: true,
      };
    });

    // Fetch kitchen orders
    let kitchenData = [];
    try {
      const res = await auth.get(`/kitchen/orders?booking_id=${booking.id}`);
      kitchenData = res.data;
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch kitchen orders");
    }

    // Stay duration — use check_in/check_out dates only (no time component)
    const checkInDate = new Date(booking.check_in);
    const checkOutDate = new Date(booking.check_out);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);
    const stayDays = Math.max(
      Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
      1
    );

    // FIX: use recomputeTotals so displayed total matches what backend expects
    const roomPrice = Number(booking.price || 0);
    const { addOnsTotal, kitchenTotal, totalAmount } = recomputeTotals(
      roomPrice,
      stayDays,
      addons,
      kitchenData
    );

    const advancePaid = Number(booking.advance_paid || 0);

    setKitchenOrders(kitchenData);
    setCheckoutBooking(booking);
    setCheckoutData({
      check_out: new Date().toISOString().slice(0, 16),
      // roomPrice = per-night rate; price = roomTotal (rate × nights)
      roomPrice,
      price: roomPrice * stayDays,
      stayDays,
      add_ons: addons,
      addOnsTotal,
      kitchenTotal,
      totalAmount,
      advancePaid,
      balanceAmount: totalAmount - advancePaid,
      status: booking.status,
      gstNumber: booking.gst_number || "",
    });
  };

  /* ─── ADD-ON HANDLERS ─────────────────────────────────────────── */
  const handleAddonSelect = (e) => {
    const addonId = e.target.value;
    if (!addonId) return;

    const addon = availableAddons.find((a) => a.id == addonId);
    if (!addon) return;

    const key = normalize(addon.name);
    if (checkoutData.add_ons[key]) {
      toast.error("Addon already selected");
      setSelectedAddonId("");
      return;
    }

    const updatedAddons = {
      ...checkoutData.add_ons,
      [key]: { label: addon.name, price: Number(addon.price), selected: true },
    };

    // FIX: recompute total the same way backend does
    const { addOnsTotal, kitchenTotal, totalAmount } = recomputeTotals(
      checkoutData.roomPrice,
      checkoutData.stayDays,
      updatedAddons,
      kitchenOrders
    );

    setCheckoutData((prev) => ({
      ...prev,
      add_ons: updatedAddons,
      addOnsTotal,
      kitchenTotal,
      totalAmount,
      balanceAmount: totalAmount - (prev.advancePaid || 0),
    }));

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

    // FIX: recompute total consistently
    const { addOnsTotal, kitchenTotal, totalAmount } = recomputeTotals(
      checkoutData.roomPrice,
      checkoutData.stayDays,
      updated,
      kitchenOrders
    );

    setCheckoutData((prev) => ({
      ...prev,
      add_ons: updated,
      addOnsTotal,
      kitchenTotal,
      totalAmount,
      balanceAmount: totalAmount - (prev.advancePaid || 0),
    }));
  };

  /* ─── CONFIRM CHECKOUT ────────────────────────────────────────── */
  const confirmCheckout = async () => {
    try {
      const finalAddOns = Object.values(checkoutData.add_ons)
        .filter((a) => a.selected)
        .map((a) => ({ name: a.label, price: a.price }));

      // FIX: recompute one final time from source-of-truth values
      // so the number sent always matches what backend independently calculates
      const { totalAmount } = recomputeTotals(
        checkoutData.roomPrice,
        checkoutData.stayDays,
        checkoutData.add_ons,
        kitchenOrders
      );

      console.log("Sending to checkout:", {
        add_ons: finalAddOns,
        total_amount: totalAmount,
      });

      await auth.post(`/bookings/${checkoutBooking.id}/checkout`, {
        check_out: checkoutData.check_out,
        add_ons: finalAddOns,
        kitchen_orders: kitchenOrders,
        total_amount: totalAmount,          // ← always in sync with backend formula
        gst_number: checkoutData.gstNumber || undefined,
      });

      toast.success("Checkout completed & bill generated");
      onDelete(checkoutBooking.id);
      setCheckoutBooking(null);
      setCheckoutData({});
      setKitchenOrders([]);
      navigate("/billing");
    } catch (err) {
      console.error(err);
      toast.error(
        "Checkout failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  /* ─── STATUS CHANGE ───────────────────────────────────────────── */
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
    } catch (err) {
      toast.error("Status update failed");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /* ─── UI ──────────────────────────────────────────────────────── */
  if (loading) return <LoadingSpinner />;

  if (!bookings?.length)
    return (
      <div className="text-center text-gray-500 mt-20">
        <p className="text-xl font-medium">No bookings found</p>
      </div>
    );

  return (
    <>
      <BookingTable
        bookings={bookings}
        parseAddOns={parseAddOns}
        formatDate={formatDate}
        onDelete={onDelete}
        onStatusChange={handleStatusChange}
      />

      {/* ══════════ CHECKOUT MODAL ══════════ */}
      {checkoutBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-4">
              Final Checkout - Generate Bill & Settle Orders
            </h3>

            <p className="text-sm text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              This will generate final bill (room + kitchen + GST), mark all
              kitchen orders as "Settled", and complete checkout.
            </p>

            <p className="mb-2">
              Room: ₹{checkoutData.roomPrice} × {checkoutData.stayDays} nights
              = ₹{checkoutData.price}
            </p>

            {/* GST Number */}
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

            {/* Add-ons */}
            <p className="font-medium mb-2">Add-ons:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(checkoutData.add_ons || {})
                .filter(([, v]) => v.selected)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm shadow-sm hover:bg-blue-200 transition-all group"
                  >
                    <span>
                      {v.label} (₹{v.price})
                    </span>
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

            {/* Kitchen orders */}
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

            {/* Totals */}
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold">
                Total: ₹{checkoutData.totalAmount}
              </p>
              <p className="text-sm text-green-600">
                Advance Paid: ₹{checkoutData.advancePaid || 0}
              </p>
              <p className="text-lg font-bold text-red-600">
                Balance Amount: ₹{checkoutData.balanceAmount}
              </p>
            </div>

            {/* Actions */}
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
