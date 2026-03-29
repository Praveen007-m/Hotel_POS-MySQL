import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import Container from "../components/layout/Container";
import RoomDayModal from "../components/rooms/RoomDayModal";
import BookingForm from "../components/booking/BookingForm";

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Home,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import StatsCard from "../components/calendar/StatsCard";

export default function RoomCalendar() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeekStart, setSelectedWeekStart] = useState(
    getStartOfWeek(new Date()),
  );
  const [selectedRoomEvent, setSelectedRoomEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);


  /* ================= HELPER FUNCTIONS ================= */
  function getStartOfWeek(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getWeekDays(weekStart) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }

  function getDaysInMonth(year, month) {
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = getStartOfWeek(firstDay);

    let current = new Date(startDate);
    while (current <= lastDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    while (current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchCalendarData();
  }, [selectedYear, selectedMonth, selectedWeekStart, viewMode]);

  const fetchCalendarData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/bookings/calendar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= GET BOOKING STATUS ================= */
/**
 * Get booking for specific room on specific date
 * IMPORTANT: Room is OCCUPIED from check_in (inclusive) to check_out (exclusive)
 * Example: check_in=2024-02-28, check_out=2024-03-01
 * → 2024-02-28: occupied ✅, 2024-02-29: occupied ✅, 2024-03-01: FREE ✅
 */
const getBookingForRoomOnDate = (room, dateString) => {
  return bookings.find((b) => {
    if (b.room_id !== room.id) return false;

    const checkIn = new Date(b.check_in);
    const checkOut = b.check_out ? new Date(b.check_out) : null;
    const current = new Date(dateString);

    // Normalize all dates to start of day (00:00:00) to ignore time/timezone issues
    checkIn.setHours(0, 0, 0, 0);
    if (checkOut) checkOut.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    if (!checkOut) {
      return current >= checkIn;
    }

    // FIXED: Use < checkOut (exclude checkout day as business rule)
    return current >= checkIn && current < checkOut;
  });
};

  /* ================= EVENT HANDLERS ================= */
  const handlePrevious = () => {
    if (viewMode === "month") {
      if (selectedMonth === 0) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(11);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else if (viewMode === "week") {
      setSelectedWeekStart(
        new Date(selectedWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
      );
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      if (selectedMonth === 11) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(0);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    } else if (viewMode === "week") {
      setSelectedWeekStart(
        new Date(selectedWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      );
    }
  };

  const handleToday = () => {
    const today = new Date();
    if (viewMode === "month") {
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth());
    } else if (viewMode === "week") {
      setSelectedWeekStart(getStartOfWeek(today));
    }
  };

  const handleRoomDateClick = (room, date) => {
    const dateStr = formatDate(date);
    const booking = getBookingForRoomOnDate(room, dateStr);

    if (booking) {
      // Existing booking → show booking details
      setSelectedRoomEvent({
        room,
        booking,
        date: dateStr,
        status: "Booked",
      });
    } else {
      // Available → open BookingForm
      setSelectedRoomForBooking(room);
      setBookingDate(dateStr);
      setShowBookingModal(true);
    }
  };

  const handleEditFromModal = (booking) => {
    navigate("/booking", { state: { editBookingId: booking.id } });
  };

  const handleViewBookings = () => {
    navigate("/booking");
  };


  const getHeaderTitle = () => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (viewMode === "month") {
      return `${monthNames[selectedMonth]} ${selectedYear}`;
    } else if (viewMode === "week") {
      const endDate = new Date(selectedWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      return `${monthNames[selectedWeekStart.getMonth()]} ${selectedWeekStart.getDate()} - ${endDate.getMonth() !== selectedWeekStart.getMonth()
        ? monthNames[endDate.getMonth()] + " "
        : ""
        }${endDate.getDate()}, ${selectedWeekStart.getFullYear()}`;
    }
  };

  // Helper for today's date display
  const getTodayDisplayDate = () => {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Calendar className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Calculate stats
  const totalRooms = rooms.length;
  const bookedToday = rooms.filter((room) =>
    getBookingForRoomOnDate(room, formatDate(new Date())),
  ).length;
  const availableToday = totalRooms - bookedToday;
  const occupancyRate =
    totalRooms > 0 ? Math.round((bookedToday / totalRooms) * 100) : 0;

  return (
   <Container>
  <div className="space-y-6">

    {/* Page Header */}
    <div className="text-center px-4 pt-2">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2">
        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Room Availability
        </span>
      </h1>
      <p className="text-gray-500 text-sm sm:text-base mb-2">
        Manage your hotel room bookings with ease
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
        <Calendar className="w-3 h-3 shrink-0" />
        <span>Today: {getTodayDisplayDate()}</span>
      </div>
    </div>

    {/* Stats Dashboard */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
      <StatsCard icon={Home}        label="Total Rooms"     value={totalRooms}          color="blue"   emoji="🏨" />
      <StatsCard icon={CheckCircle} label="Available Today" value={availableToday}       color="green"  emoji="✅" />
      <StatsCard icon={XCircle}     label="Booked Today"    value={bookedToday}          color="red"    emoji="🔴" />
      <StatsCard icon={TrendingUp}  label="Occupancy Rate"  value={`${occupancyRate}%`}  color="purple" emoji="📊"
        showProgress progressValue={occupancyRate}
      />
    </div>

    {/* Controls Row */}
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 px-4">

      {/* View Toggle */}
      <div className="flex gap-1.5 bg-gray-100/50 rounded-2xl p-1.5 w-full lg:w-auto">
        {[
          { mode: "month", icon: Calendar, label: "Month" },
          { mode: "week",  icon: List,     label: "Week"  },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-300 flex-1 lg:flex-none ${
              viewMode === mode
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-110 group"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
        </button>

        <button
          onClick={handleToday}
          className="px-5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-bold rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 active:scale-95"
        >
          Today
        </button>

        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-110 group"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
        </button>
      </div>

      {/* Title + Year selector */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          {getHeaderTitle()}
        </h3>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold hover:border-blue-400 focus:outline-none focus:border-blue-500 transition-all bg-white shadow-sm cursor-pointer"
        >
          {[...Array(10)].map((_, i) => {
            const y = new Date().getFullYear() - 5 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>
    </div>

    {/* Calendar Views */}
    <div className="px-4 pb-12">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-x-auto scrollbar-hide">
        <div className="min-w-[1000px] lg:min-w-full">
          {viewMode === "month" && (
            <MonthView
              year={selectedYear}
              month={selectedMonth}
              rooms={rooms}
              getDaysInMonth={getDaysInMonth}
              formatDate={formatDate}
              getBookingForRoomOnDate={getBookingForRoomOnDate}
              onRoomDateClick={handleRoomDateClick}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              weekStart={selectedWeekStart}
              rooms={rooms}
              getWeekDays={getWeekDays}
              formatDate={formatDate}
              getBookingForRoomOnDate={getBookingForRoomOnDate}
              onRoomDateClick={handleRoomDateClick}
            />
          )}
        </div>
      </div>
    </div>

  </div>

  {/* Modals */}
  {selectedRoomEvent && (
    <RoomDayModal
      data={selectedRoomEvent}
      onClose={() => setSelectedRoomEvent(null)}
      onEdit={handleEditFromModal}
      onViewBookings={handleViewBookings}
    />
  )}

  {showBookingModal && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl">
        <BookingForm
          selectedDate={bookingDate}
          initialData={{ room_id: selectedRoomForBooking?.id }}
          onSubmit={async (data) => {
            try {
              const token = localStorage.getItem("token");
              await axios.post(`${API_BASE_URL}/api/bookings`, data, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setShowBookingModal(false);
              fetchCalendarData();
            } catch (error) {
              console.error("Booking failed:", error);
            }
          }}
          onCancel={() => setShowBookingModal(false)}
        />
      </div>
    </div>
  )}

</Container>
  );
}
