import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "../components/layout/Container";
import BookingList from "../components/booking/BookingList";
import BookingForm from "../components/booking/BookingForm";
import auth from "../auth/axiosInstance";
import SearchInput from "../components/common/SearchInput";
import StatusDropdown from "../components/booking/DropDown";
import { toast } from 'react-toastify';
import { X } from "lucide-react";

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");

  // Search related
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  /* ================= FETCH BOOKINGS ================= */
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await auth.get("/bookings");
      setBookings(res.data);
      setFilteredBookings(
        res.data.filter(
          (booking) => booking.status?.toLowerCase() !== "checked-out",
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Open edit modal when navigated from calendar with editBookingId
  useEffect(() => {
    const editId = location.state?.editBookingId;
    if (!editId) return;

    navigate("/booking", { replace: true, state: {} });

    auth
      .get(`/bookings/${editId}`)
      .then((res) => {
        setEditingBooking(res.data);
        setModalOpen(true);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load booking");
      });
  }, [location.state?.editBookingId, navigate]);

  /* ================= SEARCH WITH LOADING ================= */
  useEffect(() => {
    setSearchLoading(true);

    const timer = setTimeout(() => {
      let result = bookings.filter(
        (booking) => booking.status?.toLowerCase() !== "checked-out",
      );

      // 🔍 Search filter
      if (search.trim()) {
        const searchText = search.toLowerCase();

        result = result.filter(
          (booking) =>
            String(booking.id).includes(searchText) ||
            booking.booking_id?.toLowerCase().includes(searchText) ||
            booking.customer_name?.toLowerCase().includes(searchText) ||
            booking.customer_contact?.toLowerCase().includes(searchText) ||
            String(booking.room_number || "").toLowerCase().includes(searchText),
        );
      }

      // 🚦 Status filter
      if (status !== "ALL") {
        result = result.filter(
          (booking) => booking.status?.toLowerCase() === status.toLowerCase(),
        );
      }

      setFilteredBookings(result);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status, bookings]);

  /* ================= CRUD ================= */
  const handleSubmit = async (data) => {
    try {
      if (editingBooking) {
        await auth.put(`/bookings/${editingBooking.id}`, data);
      } else {
        await auth.post(`/bookings`, data);
      }

      setModalOpen(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save booking");
    }
  };

  const handleDelete = async (id) => {
    try {
      await auth.delete(`/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete booking");
    }
  };

  const handleStatusUpdate = async (id, updatedData) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updatedData } : b)),
    );

    try {
      await auth.put(`/bookings/${id}`, updatedData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update booking");
    }
  };

  const handleCheckoutComplete = (id) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status: "Checked-out" } : booking,
      ),
    );
    navigate("/billing");
  };


  /* ================= UI ================= */  return (
    <Container>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bookings</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by guest, phone, booking ID, or room no..."
            className="w-full md:w-72"
          />

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <StatusDropdown
              value={status}
              onChange={setStatus}
              className="w-full sm:w-auto"
            />

            <button
              className="px-6 py-2 bg-[#0A1B4D] text-white rounded-xl shadow-md hover:bg-[#091642] transition-all whitespace-nowrap w-full sm:w-auto font-medium"
              onClick={() => setModalOpen(true)}
            >
              Create Booking
            </button>
          </div>
        </div>
      </div>

      <BookingList
        bookings={filteredBookings}
        loading={loading || searchLoading}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
        onCheckoutComplete={handleCheckoutComplete}
        onEdit={(booking) => {
          setEditingBooking(booking);
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:p-6">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditingBooking(null);
              }}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close booking form"
            >
              <X size={18} />
            </button>
            <BookingForm
              initialData={editingBooking}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalOpen(false);
                setEditingBooking(null);
              }}
            />
          </div>
        </div>
      )}
    </Container>
  );
}
