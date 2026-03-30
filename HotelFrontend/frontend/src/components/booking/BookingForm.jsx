import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";
import CustomerForm from "../customers/CustomerForm";

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

  const pad = (n) => n.toString().padStart(2, "0");

  // Format JS Date → datetime-local string
  const formatLocalDateTime = (date) => {
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  };

  // Format DB date (ISO or UTC) safely into local datetime-local format
  const formatFromDB = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  };

  // Default check-in 1PM / check-out 11AM IST
  const getDefaultDateTimes = (clickedDate) => {
    const base = clickedDate ? new Date(clickedDate) : new Date();

    // 🔥 Create LOCAL date properly (avoid UTC shift)
    const localDate = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
    );

    const checkIn = new Date(localDate);
    checkIn.setHours(13, 0, 0, 0); // 1 PM IST

    const checkOut = new Date(localDate);
    checkOut.setDate(checkOut.getDate() + 1);
    checkOut.setHours(11, 0, 0, 0); // 11 AM IST

    return {
      check_in: formatLocalDateTime(checkIn),
      check_out: formatLocalDateTime(checkOut),
    };
  };

  const [form, setForm] = useState(() => {
    // 🔹 If editing existing booking
    if (initialData && initialData.check_in) {
      return {
        ...initialData,
        check_in: formatFromDB(initialData.check_in),
        check_out: formatFromDB(initialData.check_out),
      };
    }

    // 🔹 Creating from calendar click
    return {
      booking_id: "BK-" + Date.now(),
      customer_id: "",
      room_id: initialData?.room_id || "",
      ...getDefaultDateTimes(selectedDate), // 🔥 USE selectedDate
      price: "",
      status: "Confirmed",
      people_count: 1,
      advance_paid: "",
      add_ons: {},
    };
  });

  const isRoomAvailableForDates = (roomId) => {
    if (!form.check_in) return true;

    const checkIn = new Date(form.check_in);
    const checkOut = form.check_out
      ? new Date(form.check_out)
      : new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);

    return !calendarBookings.some((b) => {
      if (b.room_id !== roomId) return false;

      const existingStart = new Date(b.check_in);
      const existingEnd = b.check_out
        ? new Date(b.check_out)
        : new Date(existingStart.getTime() + 24 * 60 * 60 * 1000);

      return checkIn < existingEnd && checkOut > existingStart;
    });
  };

  /* ===================== FETCH DATA ===================== */
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
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        setCustomers(resCustomers.data);
        setRooms(resRooms.data);
        setAvailableAddons(resAddons.data);
        setCalendarBookings(resCalendar.data);

        // Initialize add-ons
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

  /* ===================== AUTO PRICE ===================== */
  useEffect(() => {
    if (!form.room_id) return;

    const selectedRoom = rooms.find((r) => r.id === Number(form.room_id));

    if (selectedRoom) {
      const roomPrice = Number(selectedRoom.price_per_night || 0);

      setForm((prev) => ({
        ...prev,
        price: roomPrice,
      }));

      setSelectedRoomCapacity(selectedRoom.capacity);
    }
  }, [form.room_id, rooms]);

  useEffect(() => {
    if (!form.room_id) return;

    const conflict = getRoomConflict(form.room_id);

    if (conflict) {
      setRoomWarning(
        `⚠️ This room is already booked from 
        ${conflict.start.toLocaleDateString()} 
        to ${conflict.end.toLocaleDateString()}`,
      );
    } else {
      setRoomWarning("");
    }
  }, [form.check_in, form.check_out, form.room_id]);

  /* ===================== HANDLERS ===================== */

  const getRoomConflict = (roomId) => {
    const roomBookings = calendarBookings.filter((b) => b.room_id === roomId);

    if (roomBookings.length === 0) return null;

    // 🔹 If no dates selected → show first booking info
    if (!form.check_in) {
      const b = roomBookings[0];
      return {
        start: new Date(b.check_in),
        end: b.check_out
          ? new Date(b.check_out)
          : new Date(new Date(b.check_in).getTime() + 24 * 60 * 60 * 1000),
        reason: "nodates",
      };
    }

    // 🔹 Normal overlap logic when dates exist
    const checkIn = new Date(form.check_in);
    const checkOut = form.check_out
      ? new Date(form.check_out)
      : new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);

    for (const b of roomBookings) {
      const existingStart = new Date(b.check_in);
      const existingEnd = b.check_out
        ? new Date(b.check_out)
        : new Date(existingStart.getTime() + 24 * 60 * 60 * 1000);

      if (checkIn < existingEnd && checkOut > existingStart) {
        return {
          start: existingStart,
          end: existingEnd,
          reason: "overlap",
        };
      }
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // datetime-local → store as LOCAL STRING
    if (name === "check_in" || name === "check_out") {
      setForm((prev) => ({
        ...prev,
        [name]: value, // ✅ keep local
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoomChange = (e) => {
    const roomId = Number(e.target.value);
    if (!roomId) return;

    const conflict = getRoomConflict(roomId);

    // ✅ Always allow selection
    setForm((prev) => ({
      ...prev,
      room_id: roomId,
    }));

    // ⚠️ Only show warning
    if (conflict) {
      setRoomWarning(
        `This room is already booked from 
        ${conflict.start.toLocaleDateString()} 
        to ${conflict.end.toLocaleDateString()}`,
      );
    } else {
      setRoomWarning("");
    }
  };

  // ✅ Toggle dynamic add-on
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
      const res = await axios.post(`${API_BASE_URL}/api/customers`, formData, config);

      toast.success("Customer created successfully!");

      // Update customer list and select the new one
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
    if (!form.customer_id || !form.room_id) {
      toast.warning("Please select a customer and room.");
      return;
    }

    const conflict = getRoomConflict(form.room_id);

    if (conflict) {
      toast.warning(
        `Cannot save booking.\n\nRoom is already booked from 
        ${conflict.start.toLocaleDateString()} 
        to ${conflict.end.toLocaleDateString()}`,
      );
      return; // ❌ stop submission
    }

    const selectedAddOns = availableAddons
      .filter((addon) => form.add_ons[addon.name])
      .map((addon) => ({
        description: addon.name,
        amount: addon.price,
      }));

    const payload = {
      ...form,
      check_in: form.check_in || null,
      check_out: form.check_out || null,
      add_ons: selectedAddOns,
    };

    onSubmit(payload);
  };

  /* ===================== UI ===================== */
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
            ₹{form.price || "—"}
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

      {/* ================= ADD-ONS ================= */}
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
              className={`addon-btn px-3 py-1.5 rounded border transition-all duration-200 ease-out text-sm font-medium ${form.add_ons[addon.name]
                ? "bg-[#0A1B4D] text-white border-[#0A1B4D] hover:bg-[#081341] hover:border-[#081341]"
                : "bg-white border-gray-300 text-gray-700 hover:border-[#0A1B4D]"
                }`}
            >
              {addon.name} (₹{addon.price})
            </button>
          ))}
        </div>
      </div>

      {/* ================= BUTTONS ================= */}
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

      {/* ================= CUSTOMER MODAL ================= */}
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