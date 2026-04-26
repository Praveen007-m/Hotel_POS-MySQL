import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { PlusCircle, ChevronDown, Search, X, Check } from "lucide-react";
import CustomerForm from "../customers/CustomerForm";

// ─── DATE HELPERS ────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0");

const localNow = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hours: d.getHours(), minutes: d.getMinutes() };
};

const buildDateTimeLocal = (year, month, day, hours, minutes) =>
  `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}`;

const dbToInputFormat = (dbString) => {
  if (!dbString) return "";
  const [datePart, timePart] = dbString.split(" ");
  if (!datePart || !timePart) return "";
  return `${datePart}T${timePart.slice(0, 5)}`;
};

const inputToDbFormat = (inputValue) => {
  if (!inputValue) return null;
  return `${inputValue.replace("T", " ")}:00`;
};

const getDefaultDateTimes = (clickedDate) => {
  let year, month, day;
  if (!clickedDate) {
    const now = localNow();
    year = now.year; month = now.month; day = now.day;
  } else if (typeof clickedDate === "string") {
    [year, month, day] = clickedDate.split("-").map(Number);
  } else {
    year = clickedDate.getFullYear();
    month = clickedDate.getMonth() + 1;
    day = clickedDate.getDate();
  }
  const checkIn = buildDateTimeLocal(year, month, day, 13, 0);
  const nextDay = new Date(year, month - 1, day + 1);
  const checkOut = buildDateTimeLocal(nextDay.getFullYear(), nextDay.getMonth() + 1, nextDay.getDate(), 11, 0);
  return { check_in: checkIn, check_out: checkOut };
};

// ─── CONFLICT DETECTION ──────────────────────────────────────────────────────

const normaliseDateStr = (value) => {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16);
};

const addOneDayToStr = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  const [datePart, timePart] = dateTimeStr.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())} ${timePart}`;
};

const intervalsOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const friendlyDate = (normStr) => {
  if (!normStr) return "";
  const [datePart] = normStr.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  return `${pad(d)} ${MONTHS[m - 1]} ${y}`;
};

// ─── SHARED STYLES ───────────────────────────────────────────────────────────

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-150 focus:border-[#0A1B4D] focus:ring-2 focus:ring-[#0A1B4D]/10 hover:border-gray-300";

const selectCls =
  "min-h-[44px] w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-800 outline-none transition-all duration-150 focus:border-[#0A1B4D] focus:ring-2 focus:ring-[#0A1B4D]/10 hover:border-gray-300";

const selectStyle = {
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
  backgroundPosition: "right 12px center",
  backgroundSize: "16px",
  backgroundRepeat: "no-repeat",
};

function Label({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </label>
  );
}

function SectionHeading({ children }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
      <span className="h-px flex-1 bg-gray-100" />
      {children}
      <span className="h-px flex-1 bg-gray-100" />
    </p>
  );
}

// ─── SEARCHABLE CUSTOMER DROPDOWN ────────────────────────────────────────────

function CustomerDropdown({ customers, value, onChange, onAddNew, getCustomerPhone, formatCustomerLabel }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selected = customers.find((c) => Number(c.id) === Number(value));

  const filtered = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      String(c?.name || "").toLowerCase().includes(term) ||
      String(getCustomerPhone(c)).includes(term)
    );
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
    else setSearch("");
  }, [open]);

  return (
    <div className="flex items-stretch gap-2">
      {/* Trigger button */}
      <div className="relative min-w-0 flex-1" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-150
            ${open
              ? "border-[#0A1B4D] bg-white ring-2 ring-[#0A1B4D]/10"
              : "border-gray-200 bg-white hover:border-gray-300"
            }`}
        >
          {/* Selected value or placeholder */}
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A1B4D]/10 text-[10px] font-bold uppercase text-[#0A1B4D]">
                {(selected.name || "?")[0]}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium text-gray-800">{selected.name || "Unknown"}</span>
                <span className="block truncate text-xs text-gray-400">{getCustomerPhone(selected) || "No phone"}</span>
              </span>
            </span>
          ) : (
            <span className="flex-1 text-left text-gray-400">Select customer…</span>
          )}

          {/* Right controls */}
          <span className="flex shrink-0 items-center gap-1">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(null); } }}
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
                className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Clear"
              >
                <X size={12} />
              </span>
            )}
            <ChevronDown
              size={15}
              className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/10">
            {/* Search bar */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2.5">
              <Search size={14} className="shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or phone…"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Customer list */}
            <ul className="max-h-52 overflow-y-auto overscroll-contain">
              {filtered.length > 0 ? (
                filtered.map((customer) => {
                  const isActive = Number(customer.id) === Number(value);
                  return (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => { onChange(customer); setOpen(false); }}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors
                          ${isActive ? "bg-[#0A1B4D] text-white" : "text-gray-700 hover:bg-blue-50"}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase
                          ${isActive ? "bg-white/20 text-white" : "bg-[#0A1B4D]/10 text-[#0A1B4D]"}`}>
                          {(customer.name || "?")[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{customer.name || "Unknown"}</span>
                          <span className={`block truncate text-xs ${isActive ? "text-blue-200" : "text-gray-400"}`}>
                            {getCustomerPhone(customer) || "No phone"}
                          </span>
                        </span>
                        {isActive && <Check size={14} className="shrink-0" />}
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-5 text-center text-sm text-gray-400">No customers found</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Add new customer */}
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A1B4D] text-white shadow-sm transition-all hover:bg-[#081341] active:scale-95"
        title="Add New Customer"
      >
        <PlusCircle size={18} />
      </button>
    </div>
  );
}

// ─── MAIN BOOKING FORM ───────────────────────────────────────────────────────

export default function BookingForm({ initialData, selectedDate, onSubmit, onCancel }) {
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedRoomCapacity, setSelectedRoomCapacity] = useState(null);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [roomWarning, setRoomWarning] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const isEditing = Boolean(initialData);

  const [form, setForm] = useState(() => {
    if (initialData?.check_in) {
      let parsedAddOns = [];
      try {
        parsedAddOns = typeof initialData.add_ons === "string"
          ? JSON.parse(initialData.add_ons)
          : initialData.add_ons || [];
      } catch { parsedAddOns = []; }

      const addonNames = Array.isArray(parsedAddOns)
        ? parsedAddOns.map((a) => (typeof a === "string" ? a : a.description || a.name))
        : [];

      return {
        ...initialData,
        customer_id: initialData.customer_id !== undefined ? Number(initialData.customer_id) : "",
        room_id: initialData.room_id !== undefined ? Number(initialData.room_id) : "",
        check_in: dbToInputFormat(initialData.check_in),
        check_out: dbToInputFormat(initialData.check_out),
        price: Number(initialData.price) || "",
        advance_paid: Number(initialData.advance_paid) || "",
        discount: Number(initialData.discount) || 0,
        people_count: Number(initialData.people_count) || 1,
        _addonNames: addonNames,
      };
    }
    return {
      booking_id: `BK-${Date.now()}`,
      customer_id: "",
      room_id: initialData?.room_id || "",
      ...getDefaultDateTimes(selectedDate),
      price: "",
      status: "Confirmed",
      people_count: 1,
      advance_paid: "",
      discount: 0,
      add_ons: {},
    };
  });

  const getRoomConflict = (roomId) => {
    const roomBookings = calendarBookings.filter(
      (b) => b.room_id === roomId && b.booking_id !== form.booking_id
    );
    if (!roomBookings.length) return null;
    const formStart = normaliseDateStr(form.check_in);
    const formEnd = form.check_out ? normaliseDateStr(form.check_out) : addOneDayToStr(formStart);
    if (!formStart) {
      const b = roomBookings[0];
      const bs = normaliseDateStr(b.check_in);
      return { start: bs, end: b.check_out ? normaliseDateStr(b.check_out) : addOneDayToStr(bs) };
    }
    for (const b of roomBookings) {
      const bs = normaliseDateStr(b.check_in);
      const be = b.check_out ? normaliseDateStr(b.check_out) : addOneDayToStr(bs);
      if (intervalsOverlap(formStart, formEnd, bs, be)) return { start: bs, end: be };
    }
    return null;
  };

  const getCustomerPhone = (c) => c?.phone || c?.contact || "";
  const formatCustomerLabel = (c) => `${c?.name || "Unknown"} - ${getCustomerPhone(c) || "N/A"}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [resCustomers, resRooms, resAddons, resCalendar] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/customers`),
          axios.get(`${API_BASE_URL}/api/rooms`),
          axios.get(`${API_BASE_URL}/api/addons`),
          axios.get(`${API_BASE_URL}/api/bookings/calendar`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCustomers(resCustomers.data);
        setRooms(resRooms.data);
        setAvailableAddons(resAddons.data);
        setCalendarBookings(resCalendar.data);

        setForm((prev) => {
          const names = prev._addonNames || [];
          return {
            ...prev,
            customer_id: initialData?.customer_id !== undefined ? Number(initialData.customer_id) : prev.customer_id,
            room_id: initialData?.room_id !== undefined ? Number(initialData.room_id) : prev.room_id,
            add_ons: resAddons.data.reduce((acc, addon) => { acc[addon.name] = names.includes(addon.name); return acc; }, {}),
          };
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load required data.");
      }
    };
    fetchData();
  }, [initialData]);

  useEffect(() => {
    if (!form.room_id) return;
    const room = rooms.find((r) => r.id === Number(form.room_id));
    if (room) {
      setForm((prev) => ({ ...prev, price: Number(room.price_per_night) || 0 }));
      setSelectedRoomCapacity(room.capacity);
    }
  }, [form.room_id, rooms]);

  useEffect(() => {
    if (!form.room_id) return;
    const conflict = getRoomConflict(form.room_id);
    setRoomWarning(conflict ? `⚠️ Room already booked: ${friendlyDate(conflict.start)} → ${friendlyDate(conflict.end)}` : "");
  }, [form.check_in, form.check_out, form.room_id, calendarBookings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoomChange = (e) => {
    const roomId = Number(e.target.value);
    if (!roomId) return;
    setForm((prev) => ({ ...prev, room_id: roomId }));
    const formStart = normaliseDateStr(form.check_in);
    const formEnd = form.check_out ? normaliseDateStr(form.check_out) : addOneDayToStr(formStart);
    let conflict = null;
    for (const b of calendarBookings.filter((b) => b.room_id === roomId && b.booking_id !== form.booking_id)) {
      const bs = normaliseDateStr(b.check_in);
      const be = b.check_out ? normaliseDateStr(b.check_out) : addOneDayToStr(bs);
      if (!formStart || intervalsOverlap(formStart, formEnd, bs, be)) { conflict = { start: bs, end: be }; break; }
    }
    setRoomWarning(conflict ? `⚠️ Room already booked: ${friendlyDate(conflict.start)} → ${friendlyDate(conflict.end)}` : "");
  };

  const toggleAddon = (name) =>
    setForm((prev) => ({ ...prev, add_ons: { ...prev.add_ons, [name]: !prev.add_ons[name] } }));

  const handleSaveCustomer = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/customers`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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

  const handleSubmit = () => {
    if (!form.customer_id) return toast.warning("Please select a customer.");
    if (!form.room_id) return toast.warning("Please select a room.");
    if (!form.price || Number(form.price) <= 0) return toast.warning("Room price is missing.");
    if (!form.check_in) return toast.warning("Please set a check-in date.");
    const conflict = getRoomConflict(form.room_id);
    if (conflict) return toast.warning(`Room booked from ${friendlyDate(conflict.start)} to ${friendlyDate(conflict.end)}`);

    const payload = {
      booking_id: form.booking_id,
      customer_id: Number(form.customer_id),
      room_id: Number(form.room_id),
      check_in: inputToDbFormat(form.check_in),
      check_out: inputToDbFormat(form.check_out),
      status: form.status || "Confirmed",
      price: Number(form.price),
      advance_paid: Number(form.advance_paid) || 0,
      people_count: Number(form.people_count) || 1,
      discount: Number(form.discount) || 0,
      add_ons: availableAddons
        .filter((a) => form.add_ons[a.name])
        .map((a) => ({ description: a.name, amount: a.price })),
    };
    onSubmit(payload);
  };

  return (
    <div className="w-full space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-[#0A1B4D] sm:text-2xl">
          {isEditing ? "Edit Booking" : "Create Booking"}
        </h2>
        <span className="rounded-lg bg-[#0A1B4D]/8 px-2.5 py-1 font-mono text-xs font-semibold text-[#0A1B4D]">
          {form.booking_id}
        </span>
      </div>

      {/* ── Guest Info ── */}
      <section className="space-y-3">
        <SectionHeading>Guest Info</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Customer — full width on all */}
          <div className="col-span-1 sm:col-span-2">
            <Label>Customer</Label>
            <CustomerDropdown
              customers={customers}
              value={form.customer_id}
              onChange={(c) => setForm((prev) => ({ ...prev, customer_id: c ? Number(c.id) : "" }))}
              onAddNew={() => setShowCustomerModal(true)}
              getCustomerPhone={getCustomerPhone}
              formatCustomerLabel={formatCustomerLabel}
            />
          </div>

          {/* Guests */}
          <div>
            <Label>Number of Guests</Label>
            <input
              type="number"
              min={1}
              name="people_count"
              value={form.people_count ?? ""}
              onInput={(e) =>
                setForm((prev) => ({ ...prev, people_count: e.target.value === "" ? "" : Number(e.target.value) }))
              }
              className={inputCls}
            />
            {selectedRoomCapacity && (
              <p className="mt-1 text-xs text-gray-400">Capacity: {selectedRoomCapacity} guests</p>
            )}
            {selectedRoomCapacity && form.people_count > selectedRoomCapacity && (
              <p className="mt-1.5 rounded-lg border-l-4 border-red-500 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700">
                ⚠️ Exceeds room capacity ({selectedRoomCapacity})
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <select name="status" value={form.status} onChange={handleChange} className={selectCls} style={selectStyle}>
              <option value="Checked-in">Checked-in</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked-out">Checked-out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Room & Dates ── */}
      <section className="space-y-3">
        <SectionHeading>Room & Dates</SectionHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Room — full width */}
          <div className="col-span-1 sm:col-span-2">
            <Label>Room</Label>
            <select name="room_id" value={form.room_id || ""} onChange={handleRoomChange} className={selectCls} style={selectStyle}>
              <option value="">Choose room…</option>
              {rooms.map((room) => (
                <option key={room.id} value={Number(room.id)}>
                  Room {room.room_number || "N/A"} — {room.category || "General"}
                </option>
              ))}
            </select>
            {roomWarning && (
              <p className="mt-1.5 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                {roomWarning}
              </p>
            )}
          </div>

          {/* Check-in */}
          <div>
            <Label>Check-in</Label>
            <input type="datetime-local" name="check_in" value={form.check_in || ""} onChange={handleChange} className={inputCls} />
          </div>

          {/* Check-out */}
          <div>
            <Label>Check-out</Label>
            <input type="datetime-local" name="check_out" value={form.check_out || ""} onChange={handleChange} className={inputCls} />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="space-y-3">
        <SectionHeading>Pricing</SectionHeading>
        {/* 3-col on sm+, 2-col on xs with last item full-width trick */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Room Price */}
          <div>
            <Label>Room Price / Night</Label>
            <div className="flex min-h-[44px] items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
              {form.price ? `₹${Number(form.price).toLocaleString("en-IN")}` : "—"}
            </div>
          </div>

          {/* Advance */}
          <div>
            <Label>Advance Paid</Label>
            <input
              type="number"
              min={0}
              name="advance_paid"
              value={form.advance_paid ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, advance_paid: e.target.value === "" ? "" : Number(e.target.value) }))
              }
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Discount — spans 2 cols on xs so it's not orphaned */}
          <div className="col-span-2 sm:col-span-1">
            <Label>Discount</Label>
            <input
              type="number"
              min={0}
              name="discount"
              value={form.discount === 0 ? "" : form.discount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, discount: e.target.value === "" ? "" : Number(e.target.value) }))
              }
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ── Add-ons ── */}
      {availableAddons.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Add-ons</SectionHeading>
          {/* Responsive: 1 col mobile → 2 col small → 3 col large */}
          <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 lg:grid-cols-3">
            {availableAddons.map((addon) => {
              const active = !!form.add_ons[addon.name];
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.name)}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all duration-150 active:scale-[0.97]
                    ${active
                      ? "border-[#0A1B4D] bg-[#0A1B4D] text-white shadow-md shadow-[#0A1B4D]/20"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#0A1B4D]/40 hover:bg-[#0A1B4D]/5"
                    }`}
                >
                  {/* Checkbox indicator */}
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors
                    ${active ? "border-white/40 bg-white/20" : "border-gray-300 bg-gray-50"}`}>
                    {active && <Check size={11} className="text-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate leading-tight">{addon.name}</span>
                    <span className={`block text-xs leading-tight ${active ? "text-blue-200" : "text-gray-400"}`}>
                      ₹{Number(addon.price).toLocaleString("en-IN")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      {/*
        Mobile:  stacked, Cancel on bottom (reversed col order via flex-col-reverse)
        Desktop: row, right-aligned
      */}
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end sm:gap-3">
        <button
          onClick={onCancel}
          className="w-full rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-[#0A1B4D] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0A1B4D]/25 transition-all hover:bg-[#081341] active:scale-[0.98] sm:w-auto"
        >
          Save Booking
        </button>
      </div>

      {/* ── Add Customer Modal ── */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl sm:p-6">
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <CustomerForm onSave={handleSaveCustomer} onCancel={() => setShowCustomerModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
