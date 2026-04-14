import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";
import CustomerForm from "../customers/CustomerForm";

// ─────────────────────────────────────────────────────────────
// DATE HELPERS  (pure string — zero Date() construction)
// ─────────────────────────────────────────────────────────────

/** Zero-pad a number to 2 digits */
const pad = (n) => String(n).padStart(2, "0");

/**
 * Returns today's date parts using the LOCAL wall clock.
 * We read from Date only to get year/month/day/hour/min — we never
 * let the Date object reinterpret a string from the DB or the user.
 */
const localNow = () => {
  const d = new Date(); // safe: no string passed in → no timezone shift
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1, // 1-based
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
};

/**
 * Build "YYYY-MM-DDThh:mm" from individual parts.
 * Used only when we construct default check-in/out times from today's date.
 */
const buildDateTimeLocal = (year, month, day, hours, minutes) =>
  `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}`;

/**
 * Convert a DB datetime string "YYYY-MM-DD HH:mm:ss" (or "YYYY-MM-DD HH:mm")
 * to the datetime-local input format "YYYY-MM-DDThh:mm".
 * Pure string manipulation — no Date() construction at all.
 */
const dbToInputFormat = (dbString) => {
  if (!dbString) return "";
  // Support both "YYYY-MM-DD HH:mm:ss" and "YYYY-MM-DD HH:mm"
  const [datePart, timePart] = dbString.split(" ");
  if (!datePart || !timePart) return "";
  const hhmm = timePart.slice(0, 5); // "HH:mm"
  return `${datePart}T${hhmm}`;       // "YYYY-MM-DDThh:mm"
};

/**
 * Convert "YYYY-MM-DDThh:mm" (datetime-local value) back to
 * "YYYY-MM-DD HH:mm:ss" for the API payload.
 * Pure string — no Date() construction.
 */
const inputToDbFormat = (inputValue) => {
  if (!inputValue) return null;
  // inputValue is "YYYY-MM-DDThh:mm"
  return inputValue.replace("T", " ") + ":00";
};

/**
 * Compute default check-in / check-out strings for a clicked calendar date.
 *
 * `clickedDate` is whatever FullCalendar / the calendar widget gives us.
 *  - If it is a plain "YYYY-MM-DD" string  → use it directly.
 *  - If it is a Date object (unavoidable from the calendar library)
 *    → read LOCAL year/month/day so no UTC shift occurs.
 *
 * Default times: check-in 13:00, check-out 11:00 next day.
 */
const getDefaultDateTimes = (clickedDate) => {
  let year, month, day;

  if (!clickedDate) {
    // No date passed — fall back to today (local wall clock)
    const n = localNow();
    year = n.year;
    month = n.month;
    day = n.day;
  } else if (typeof clickedDate === "string") {
    // "YYYY-MM-DD" — split directly, never pass to new Date()
    const [y, m, d] = clickedDate.split("-").map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    // Date object from calendar library — read LOCAL parts only
    year = clickedDate.getFullYear();
    month = clickedDate.getMonth() + 1;
    day = clickedDate.getDate();
  }

  const checkIn = buildDateTimeLocal(year, month, day, 13, 0);

  // Next day for check-out — increment day safely
  let coYear = year;
  let coMonth = month;
  let coDay = day + 1;

  // Simple day overflow: delegate only the carry to a Date object
  // constructed from NUMBERS (not strings) — this is safe because
  // Date(year, month-1, day) uses LOCAL time, no UTC conversion.
  const nextDay = new Date(year, month - 1, day + 1);
  coYear = nextDay.getFullYear();
  coMonth = nextDay.getMonth() + 1;
  coDay = nextDay.getDate();

  const checkOut = buildDateTimeLocal(coYear, coMonth, coDay, 11, 0);

  return { check_in: checkIn, check_out: checkOut };
};

// ─────────────────────────────────────────────────────────────
// STRING-BASED CONFLICT DETECTION
// ─────────────────────────────────────────────────────────────

/**
 * Normalise any datetime value to the comparable string "YYYY-MM-DD HH:mm".
 * Accepts:
 *   "YYYY-MM-DD HH:mm:ss"   → "YYYY-MM-DD HH:mm"
 *   "YYYY-MM-DDThh:mm"      → "YYYY-MM-DD HH:mm"
 *   "YYYY-MM-DD HH:mm"      → unchanged
 * Returns "" for falsy input.
 */
const normaliseDateStr = (value) => {
  if (!value) return "";
  // Replace T separator, then take first 16 chars → "YYYY-MM-DD HH:mm"
  return value.replace("T", " ").slice(0, 16);
};

/**
 * Adds one day to a "YYYY-MM-DD HH:mm" string without Date() string parsing.
 * Used ONLY to synthesise a fallback check-out when a booking has none.
 */
const addOneDayToStr = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  const [datePart, timePart] = dateTimeStr.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  // Safe: constructed from numbers, uses local time
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())} ${timePart}`;
};

/**
 * Pure string comparison overlap check.
 * Two intervals [aStart, aEnd) and [bStart, bEnd) overlap when:
 *   aStart < bEnd  AND  aEnd > bStart
 * String comparison works correctly for "YYYY-MM-DD HH:mm" format.
 */
const intervalsOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

// ─────────────────────────────────────────────────────────────
// DISPLAY HELPER
// ─────────────────────────────────────────────────────────────

/**
 * Format "YYYY-MM-DD HH:mm" to a readable "DD MMM YYYY" for warning messages.
 * Pure string — no Date() construction.
 */
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const friendlyDate = (normStr) => {
  if (!normStr) return "";
  const [datePart] = normStr.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  return `${pad(d)} ${MONTHS[m - 1]} ${y}`;
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function BookingForm({
  initialData,
  selectedDate,
  onSubmit,
  onCancel,
}) {
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedRoomCapacity, setSelectedRoomCapacity] = useState(null);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [roomWarning, setRoomWarning] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const isEditing = Boolean(initialData);

  // ── Initial form state ──────────────────────────────────────
  const [form, setForm] = useState(() => {
    if (initialData && initialData.check_in) {
      return {
        ...initialData,
        // DB format → input format (pure string, no timezone shift)
        check_in: dbToInputFormat(initialData.check_in),
        check_out: dbToInputFormat(initialData.check_out),
        price: Number(initialData.price) || "",
        advance_paid: Number(initialData.advance_paid) || "",
        people_count: Number(initialData.people_count) || 1,
      };
    }

    return {
      booking_id: "BK-" + Date.now(),
      customer_id: "",
      room_id: initialData?.room_id || "",
      ...getDefaultDateTimes(selectedDate),
      price: "",
      status: "Confirmed",
      people_count: 1,
      advance_paid: "",
      add_ons: {},
    };
  });

  // ── Conflict detection (string-based) ───────────────────────
  /**
   * Returns a conflict object { start, end } (as normalised strings) if the
   * given roomId overlaps with an existing booking, otherwise null.
   *
   * Skips the booking being edited (same booking_id) to allow re-saving.
   */
  const getRoomConflict = (roomId) => {
    const roomBookings = calendarBookings.filter(
      (b) =>
        b.room_id === roomId &&
        // When editing, skip the current booking so it doesn't conflict with itself
        b.booking_id !== form.booking_id
    );
    if (roomBookings.length === 0) return null;

    // Normalise the form's check-in/out to comparable strings
    const formStart = normaliseDateStr(form.check_in);
    const formEnd = form.check_out
      ? normaliseDateStr(form.check_out)
      : addOneDayToStr(formStart);

    // If no check-in is set yet, treat the first booking on this room as a soft conflict
    if (!formStart) {
      const b = roomBookings[0];
      const bStart = normaliseDateStr(b.check_in);
      const bEnd = b.check_out
        ? normaliseDateStr(b.check_out)
        : addOneDayToStr(bStart);
      return { start: bStart, end: bEnd };
    }

    for (const b of roomBookings) {
      const bStart = normaliseDateStr(b.check_in);
      const bEnd = b.check_out
        ? normaliseDateStr(b.check_out)
        : addOneDayToStr(bStart);

      if (intervalsOverlap(formStart, formEnd, bStart, bEnd)) {
        return { start: bStart, end: bEnd };
      }
    }

    return null;
  };

  // ── Fetch data on mount ─────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [resCustomers, resRooms, resAddons, resCalendar] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/api/customers`),
            axios.get(`${API_BASE_URL}/api/rooms`),
            axios.get(`${API_BASE_URL}/api/addons`),
            axios.get(`${API_BASE_URL}/api/bookings/calendar`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        setCustomers(resCustomers.data);
        setRooms(resRooms.data);
        setAvailableAddons(resAddons.data);
        setCalendarBookings(resCalendar.data);

        // Build initial add_ons map from fetched addons
        const addonsObj = {};
        resAddons.data.forEach((a) => {
          addonsObj[a.name] = false;
        });

        setForm((prev) => ({
          ...prev,
          add_ons: initialData?.add_ons
            ? resAddons.data.reduce((acc, a) => {
                acc[a.name] = initialData.add_ons.includes(a.name);
                return acc;
              }, {})
            : addonsObj,
        }));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load required data.");
      }
    };

    fetchData();
  }, [initialData]);

  // ── Auto-fill price when room changes ──────────────────────
  useEffect(() => {
    if (!form.room_id) return;

    const selectedRoom = rooms.find((r) => r.id === Number(form.room_id));
    if (selectedRoom) {
      setForm((prev) => ({
        ...prev,
        price: Number(selectedRoom.price_per_night) || 0,
      }));
      setSelectedRoomCapacity(selectedRoom.capacity);
    }
  }, [form.room_id, rooms]);

  // ── Recompute room warning when dates or room changes ───────
  useEffect(() => {
    if (!form.room_id) return;
    const conflict = getRoomConflict(form.room_id);
    if (conflict) {
      setRoomWarning(
        `⚠️ This room is already booked from ${friendlyDate(conflict.start)} to ${friendlyDate(conflict.end)}`
      );
    } else {
      setRoomWarning("");
    }
  }, [form.check_in, form.check_out, form.room_id, calendarBookings]);

  // ── Generic field handler ───────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Room selector ───────────────────────────────────────────
  const handleRoomChange = (e) => {
    const roomId = Number(e.target.value);
    if (!roomId) return;

    setForm((prev) => ({ ...prev, room_id: roomId }));

    // Conflict check will run via useEffect above; but we can also set immediately
    // by computing against current form dates (room_id update is async in state,
    // so we pass roomId directly here).
    const roomBookings = calendarBookings.filter(
      (b) => b.room_id === roomId && b.booking_id !== form.booking_id
    );

    const formStart = normaliseDateStr(form.check_in);
    const formEnd = form.check_out
      ? normaliseDateStr(form.check_out)
      : addOneDayToStr(formStart);

    let conflict = null;
    for (const b of roomBookings) {
      const bStart = normaliseDateStr(b.check_in);
      const bEnd = b.check_out
        ? normaliseDateStr(b.check_out)
        : addOneDayToStr(bStart);
      if (!formStart || intervalsOverlap(formStart, formEnd, bStart, bEnd)) {
        conflict = { start: bStart, end: bEnd };
        break;
      }
    }

    if (conflict) {
      setRoomWarning(
        `⚠️ This room is already booked from ${friendlyDate(conflict.start)} to ${friendlyDate(conflict.end)}`
      );
    } else {
      setRoomWarning("");
    }
  };

  // ── Add-on toggle ───────────────────────────────────────────
  const toggleAddon = (addonName) => {
    setForm((prev) => ({
      ...prev,
      add_ons: {
        ...prev.add_ons,
        [addonName]: !prev.add_ons[addonName],
      },
    }));
  };

  // ── Inline customer creation ────────────────────────────────
  const handleSaveCustomer = async (formData) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const res = await axios.post(
        `${API_BASE_URL}/api/customers`,
        formData,
        config
      );
      toast.success("Customer created successfully!");
      const newCustomer = res.data.customer || res.data;
      setCustomers((prev) => [...prev, newCustomer]);
      setForm((prev) => ({ ...prev, customer_id: newCustomer.id }));
      setShowCustomerModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save customer");
    }
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.customer_id) {
      toast.warning("Please select a customer.");
      return;
    }
    if (!form.room_id) {
      toast.warning("Please select a room.");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.warning("Room price is missing. Please select a valid room.");
      return;
    }
    if (!form.check_in) {
      toast.warning("Please set a check-in date.");
      return;
    }

    const conflict = getRoomConflict(form.room_id);
    if (conflict) {
      toast.warning(
        `Cannot save booking. Room is already booked from ${friendlyDate(conflict.start)} to ${friendlyDate(conflict.end)}`
      );
      return;
    }

    const selectedAddOns = availableAddons
      .filter((addon) => form.add_ons[addon.name])
      .map((addon) => ({
        description: addon.name,
        amount: addon.price,
      }));

    const payload = {
      booking_id: form.booking_id,
      customer_id: Number(form.customer_id),
      room_id: Number(form.room_id),
      // Convert datetime-local strings back to DB format (pure string, no Date())
      check_in: inputToDbFormat(form.check_in),
      check_out: inputToDbFormat(form.check_out),
      status: form.status || "Confirmed",
      price: Number(form.price),
      advance_paid: Number(form.advance_paid) || 0,
      people_count: Number(form.people_count) || 1,
      add_ons: selectedAddOns,
    };

    console.log("📦 Submitting booking payload:", payload);
    onSubmit(payload);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0A1B4D] mb-6">
        {isEditing ? "EDIT BOOKING" : "CREATE BOOKING"}
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Booking ID */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Booking ID
          </label>
          <input
            disabled
            value={form.booking_id}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
          />
        </div>

        {/* Customer */}
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Customer
          </label>
          <div className="flex gap-2">
            <select
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              className="form-select flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white appearance-none bg-no-repeat transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230A1B4D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundPosition: "right 8px center",
                backgroundSize: "16px",
                paddingRight: "28px",
              }}
            >
              <option value="">CHOOSE CUSTOMER</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.contact}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="p-2 bg-[#0A1B4D] text-white rounded hover:bg-[#081341] transition-colors shadow-sm"
              title="Add New Customer"
            >
              <PlusCircle size={20} />
            </button>
          </div>
        </div>

        {/* Number of Guests */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Number of Guests
          </label>
          <input
            type="number"
            min={1}
            name="people_count"
            value={form.people_count ?? ""}
            onInput={(e) => {
              const val = e.target.value;
              setForm((prev) => ({
                ...prev,
                people_count: val === "" ? "" : Number(val),
              }));
            }}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
          {selectedRoomCapacity && (
            <p className="text-xs text-gray-500 mt-1">
              Room capacity: {selectedRoomCapacity} guests
            </p>
          )}
          {selectedRoomCapacity && form.people_count > selectedRoomCapacity && (
            <p className="bg-red-50 border-l-4 border-red-600 text-red-800 text-xs px-2 py-1.5 rounded mt-2">
              ⚠️ EXCEEDS CAPACITY ({selectedRoomCapacity} GUESTS)
            </p>
          )}
        </div>

        {/* Room */}
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Room
          </label>
          <select
            name="room_id"
            value={form.room_id}
            onChange={handleRoomChange}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white appearance-none bg-no-repeat transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230A1B4D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundPosition: "right 8px center",
              backgroundSize: "16px",
              paddingRight: "28px",
            }}
          >
            <option value="">CHOOSE ROOM</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.room_number} — {r.category}
              </option>
            ))}
          </select>
          {roomWarning && (
            <p className="bg-red-50 border-l-4 border-red-600 text-red-800 text-xs px-2 py-1.5 rounded mt-2">
              {roomWarning}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Room Price
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm font-medium text-gray-700">
            {form.price ? `₹${form.price}` : "—"}
          </div>
        </div>

        {/* Advance Paid */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Advance Amount
          </label>
          <input
            type="number"
            min={0}
            name="advance_paid"
            value={form.advance_paid ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                advance_paid:
                  e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="form-input w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
            placeholder="0"
          />
        </div>

        {/* Check-in */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Check-in
          </label>
          <input
            type="datetime-local"
            name="check_in"
            value={form.check_in || ""}
            onChange={handleChange}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        {/* Check-out */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Check-out
          </label>
          <input
            type="datetime-local"
            name="check_out"
            value={form.check_out || ""}
            onChange={handleChange}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block uppercase">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white appearance-none bg-no-repeat transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230A1B4D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundPosition: "right 8px center",
              backgroundSize: "16px",
              paddingRight: "28px",
            }}
          >
            <option value="Checked-in">CHECKED-IN</option>
            <option value="Confirmed">CONFIRMED</option>
            <option value="Checked-out">CHECKED-OUT</option>
            <option value="Cancelled">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Add-ons */}
      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-3 uppercase">
          Add-ons
        </p>
        <div className="flex flex-wrap gap-2">
          {availableAddons.map((addon) => (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggleAddon(addon.name)}
              className={`addon-btn px-3 py-1.5 rounded border transition-all duration-200 ease-out text-sm font-medium ${
                form.add_ons[addon.name]
                  ? "bg-[#0A1B4D] text-white border-[#0A1B4D] hover:bg-[#081341] hover:border-[#081341]"
                  : "bg-white border-gray-300 text-gray-700 hover:border-[#0A1B4D]"
              }`}
            >
              {addon.name} (₹{addon.price})
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 ease-out text-sm font-medium"
        >
          CANCEL
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#0A1B4D] text-white rounded hover:bg-[#081341] transition-colors duration-200 ease-out text-sm font-medium"
        >
          SAVE BOOKING
        </button>
      </div>

      {/* Customer modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 relative">
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              ✕
            </button>
            <CustomerForm
              onSave={handleSaveCustomer}
              onCancel={() => setShowCustomerModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
