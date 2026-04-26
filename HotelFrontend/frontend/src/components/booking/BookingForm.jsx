import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { PlusCircle, ChevronDown, Search, X } from "lucide-react";
import CustomerForm from "../customers/CustomerForm";

// DATE HELPERS (pure string; no Date parsing from DB/user strings)

const pad = (n) => String(n).padStart(2, "0");

const localNow = () => {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
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
  let year;
  let month;
  let day;

  if (!clickedDate) {
    const now = localNow();
    year = now.year;
    month = now.month;
    day = now.day;
  } else if (typeof clickedDate === "string") {
    [year, month, day] = clickedDate.split("-").map(Number);
  } else {
    year = clickedDate.getFullYear();
    month = clickedDate.getMonth() + 1;
    day = clickedDate.getDate();
  }

  const checkIn = buildDateTimeLocal(year, month, day, 13, 0);
  const nextDay = new Date(year, month - 1, day + 1);
  const checkOut = buildDateTimeLocal(
    nextDay.getFullYear(),
    nextDay.getMonth() + 1,
    nextDay.getDate(),
    11,
    0
  );

  return { check_in: checkIn, check_out: checkOut };
};

// STRING-BASED CONFLICT DETECTION

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

const intervalsOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

// DISPLAY HELPER

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const friendlyDate = (normStr) => {
  if (!normStr) return "";
  const [datePart] = normStr.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  return `${pad(d)} ${MONTHS[m - 1]} ${y}`;
};

// ─── Searchable Customer Dropdown ───────────────────────────────────────────

function CustomerDropdown({
  customers,
  value,
  onChange,
  onAddNew,
  getCustomerPhone,
  formatCustomerLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selected = customers.find((c) => Number(c.id) === Number(value));

  const filtered = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const name = String(c?.name || "").toLowerCase();
    const phone = String(getCustomerPhone(c));
    return name.includes(term) || phone.includes(term);
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (customer) => {
    onChange(customer);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  return (
    <div className="flex items-stretch gap-2">
      {/* Dropdown trigger */}
      <div className="relative flex-1" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-100 flex items-center justify-between gap-2 ${
            open
              ? "border-[#0A1B4D] ring-2 ring-blue-100"
              : "border-gray-300 hover:border-gray-400"
          } bg-white`}
        >
          {selected ? (
            <span className="flex-1 truncate text-gray-800">
              {formatCustomerLabel(selected)}
            </span>
          ) : (
            <span className="flex-1 truncate text-gray-400">
              Select customer
            </span>
          )}

          <span className="flex items-center gap-1 shrink-0">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
                onClick={handleClear}
                className="inline-flex items-center justify-center rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Clear selection"
              >
                <X size={13} />
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
          <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            {/* Search input inside dropdown */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
              <Search size={14} className="shrink-0 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or phone…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                      Number(customer.id) === Number(value)
                        ? "bg-[#0A1B4D] text-white"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <span className="font-medium truncate">
                      {customer.name || "Unknown Customer"}
                    </span>
                    <span
                      className={`ml-4 shrink-0 text-xs ${
                        Number(customer.id) === Number(value)
                          ? "text-blue-200"
                          : "text-gray-400"
                      }`}
                    >
                      {getCustomerPhone(customer) || "N/A"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  No customers found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add new customer button */}
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A1B4D] text-white shadow-sm transition-colors hover:bg-[#081341]"
        title="Add New Customer"
      >
        <PlusCircle size={20} />
      </button>
    </div>
  );
}

// ─── Main BookingForm ────────────────────────────────────────────────────────

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

  const [form, setForm] = useState(() => {
    if (initialData && initialData.check_in) {
      let parsedAddOns = [];
      try {
        parsedAddOns =
          typeof initialData.add_ons === "string"
            ? JSON.parse(initialData.add_ons)
            : initialData.add_ons || [];
      } catch {
        parsedAddOns = [];
      }

      const addonNames = Array.isArray(parsedAddOns)
        ? parsedAddOns.map((addon) =>
            typeof addon === "string" ? addon : addon.description || addon.name
          )
        : [];

      return {
        ...initialData,
        customer_id:
          initialData.customer_id !== undefined
            ? Number(initialData.customer_id)
            : "",
        room_id:
          initialData.room_id !== undefined ? Number(initialData.room_id) : "",
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
      (booking) =>
        booking.room_id === roomId && booking.booking_id !== form.booking_id
    );

    if (roomBookings.length === 0) return null;

    const formStart = normaliseDateStr(form.check_in);
    const formEnd = form.check_out
      ? normaliseDateStr(form.check_out)
      : addOneDayToStr(formStart);

    if (!formStart) {
      const booking = roomBookings[0];
      const bookingStart = normaliseDateStr(booking.check_in);
      const bookingEnd = booking.check_out
        ? normaliseDateStr(booking.check_out)
        : addOneDayToStr(bookingStart);
      return { start: bookingStart, end: bookingEnd };
    }

    for (const booking of roomBookings) {
      const bookingStart = normaliseDateStr(booking.check_in);
      const bookingEnd = booking.check_out
        ? normaliseDateStr(booking.check_out)
        : addOneDayToStr(bookingStart);

      if (intervalsOverlap(formStart, formEnd, bookingStart, bookingEnd)) {
        return { start: bookingStart, end: bookingEnd };
      }
    }

    return null;
  };

  const getCustomerPhone = (customer) =>
    customer?.phone || customer?.contact || "";

  const formatCustomerLabel = (customer) => {
    const name = customer?.name || "Unknown Customer";
    const phone = getCustomerPhone(customer) || "N/A";
    return `${name} - ${phone}`;
  };

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

        setForm((prev) => {
          const names = prev._addonNames || [];
          return {
            ...prev,
            customer_id:
              initialData && initialData.customer_id !== undefined
                ? Number(initialData.customer_id)
                : prev.customer_id,
            room_id:
              initialData && initialData.room_id !== undefined
                ? Number(initialData.room_id)
                : prev.room_id,
            add_ons: resAddons.data.reduce((acc, addon) => {
              acc[addon.name] = names.includes(addon.name);
              return acc;
            }, {}),
          };
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load required data.");
      }
    };

    fetchData();
  }, [initialData]);

  useEffect(() => {
    if (!form.room_id) return;

    const selectedRoom = rooms.find((room) => room.id === Number(form.room_id));
    if (selectedRoom) {
      setForm((prev) => ({
        ...prev,
        price: Number(selectedRoom.price_per_night) || 0,
      }));
      setSelectedRoomCapacity(selectedRoom.capacity);
    }
  }, [form.room_id, rooms]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoomChange = (e) => {
    const roomId = Number(e.target.value);
    if (!roomId) return;

    setForm((prev) => ({ ...prev, room_id: roomId }));

    const roomBookings = calendarBookings.filter(
      (booking) =>
        booking.room_id === roomId && booking.booking_id !== form.booking_id
    );

    const formStart = normaliseDateStr(form.check_in);
    const formEnd = form.check_out
      ? normaliseDateStr(form.check_out)
      : addOneDayToStr(formStart);

    let conflict = null;
    for (const booking of roomBookings) {
      const bookingStart = normaliseDateStr(booking.check_in);
      const bookingEnd = booking.check_out
        ? normaliseDateStr(booking.check_out)
        : addOneDayToStr(bookingStart);

      if (
        !formStart ||
        intervalsOverlap(formStart, formEnd, bookingStart, bookingEnd)
      ) {
        conflict = { start: bookingStart, end: bookingEnd };
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

  const toggleAddon = (addonName) => {
    setForm((prev) => ({
      ...prev,
      add_ons: {
        ...prev.add_ons,
        [addonName]: !prev.add_ons[addonName],
      },
    }));
  };

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
      check_in: inputToDbFormat(form.check_in),
      check_out: inputToDbFormat(form.check_out),
      status: form.status || "Confirmed",
      price: Number(form.price),
      advance_paid: Number(form.advance_paid) || 0,
      people_count: Number(form.people_count) || 1,
      discount: Number(form.discount) || 0,
      add_ons: selectedAddOns,
    };

    onSubmit(payload);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#0A1B4D] sm:text-2xl">
        {isEditing ? "EDIT BOOKING" : "CREATE BOOKING"}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Booking ID */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Booking ID
          </label>
          <input
            disabled
            value={form.booking_id}
            className="form-input w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* Customer — searchable dropdown */}
        <div className="sm:col-span-2 xl:col-span-2">
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Customer
          </label>
          <CustomerDropdown
            customers={customers}
            value={form.customer_id}
            onChange={(customer) =>
              setForm((prev) => ({
                ...prev,
                customer_id: customer ? Number(customer.id) : "",
              }))
            }
            onAddNew={() => setShowCustomerModal(true)}
            getCustomerPhone={getCustomerPhone}
            formatCustomerLabel={formatCustomerLabel}
          />
        </div>

        {/* Number of Guests */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Number of Guests
          </label>
          <input
            type="number"
            min={1}
            name="people_count"
            value={form.people_count ?? ""}
            onInput={(e) => {
              const value = e.target.value;
              setForm((prev) => ({
                ...prev,
                people_count: value === "" ? "" : Number(value),
              }));
            }}
            className="form-input min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {selectedRoomCapacity && (
            <p className="mt-1 text-xs text-gray-500">
              Room capacity: {selectedRoomCapacity} guests
            </p>
          )}
          {selectedRoomCapacity && form.people_count > selectedRoomCapacity && (
            <p className="mt-2 rounded border-l-4 border-red-600 bg-red-50 px-2 py-1.5 text-xs text-red-800">
              ⚠️ EXCEEDS CAPACITY ({selectedRoomCapacity} GUESTS)
            </p>
          )}
        </div>

        {/* Room */}
        <div className="sm:col-span-2 xl:col-span-2">
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Room
          </label>
          <select
            name="room_id"
            value={form.room_id || ""}
            onChange={handleRoomChange}
            className="form-select min-h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white bg-no-repeat px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230A1B4D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
              paddingRight: "40px",
            }}
          >
            <option value="">CHOOSE ROOM</option>
            {rooms.map((room) => (
              <option key={room.id} value={Number(room.id)}>
                Room {room.room_number || "N/A"} — {room.category || "General"}
              </option>
            ))}
          </select>
          {roomWarning && (
            <p className="mt-2 rounded border-l-4 border-red-600 bg-red-50 px-2 py-1.5 text-xs text-red-800">
              {roomWarning}
            </p>
          )}
        </div>

        {/* Room Price */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Room Price
          </label>
          <div className="flex min-h-11 w-full items-center rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            {form.price ? `₹${form.price}` : "—"}
          </div>
        </div>

        {/* Advance Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
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
            className="form-input min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="0"
          />
        </div>

        {/* Discount */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Discount
          </label>
          <input
            type="number"
            min={0}
            name="discount"
            value={form.discount === 0 ? "" : form.discount}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discount:
                  e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="form-input min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="0"
          />
        </div>

        {/* Check-in */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Check-in
          </label>
          <input
            type="datetime-local"
            name="check_in"
            value={form.check_in || ""}
            onChange={handleChange}
            className="form-input min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Check-out */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Check-out
          </label>
          <input
            type="datetime-local"
            name="check_out"
            value={form.check_out || ""}
            onChange={handleChange}
            className="form-input min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-medium uppercase text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="form-select min-h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white bg-no-repeat px-3 py-2 text-sm transition-all duration-200 ease-out focus:border-[#0A1B4D] focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230A1B4D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
              paddingRight: "40px",
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
      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="mb-3 text-sm font-medium uppercase text-gray-700">
          Add-ons
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {availableAddons.map((addon) => (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggleAddon(addon.name)}
              className={`addon-btn inline-flex w-full items-center justify-start rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ease-out ${
                form.add_ons[addon.name]
                  ? "border-[#0A1B4D] bg-[#0A1B4D] text-white hover:border-[#081341] hover:bg-[#081341]"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#0A1B4D]"
              }`}
            >
              {addon.name} (₹{addon.price})
            </button>
          ))}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <button
          onClick={onCancel}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 ease-out hover:bg-gray-100 sm:w-auto"
        >
          CANCEL
        </button>
        <button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-[#0A1B4D] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-[#081341] sm:w-auto"
        >
          SAVE BOOKING
        </button>
      </div>

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4">
          <div className="relative w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6">
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close customer form"
            >
              ×
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
