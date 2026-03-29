import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import RoomCard from "./RoomCard";
import RoomForm from "./RoomForm";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { toast } from 'react-toastify';
export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { user } = useAuth();
  const API_ROOMS = `${API_BASE_URL}/api/rooms`;

  /* ================= FETCH ROOMS ================= */
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ROOMS);
      setRooms(res.data);
      setFilteredRooms(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  /* ================= CATEGORIES ================= */
  const derivedCategories = useMemo(() => {
    const cats = new Set(rooms.map(r => r.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [rooms]);

  /* ================= FILTER ================= */
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);

    if (value === "ALL") {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(
        rooms.filter((room) => room.category === value)
      );
    }
  };

  /* ================= ADD / EDIT ================= */
  const handleSubmit = async (roomData) => {
    try {
      if (editingRoom) {
        await axios.put(`${API_ROOMS}/${editingRoom.id}`, roomData);
      } else {
        await axios.post(API_ROOMS, roomData);
      }
      setModalOpen(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save room");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_ROOMS}/${id}`);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      setFilteredRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete room");
    }
  };

  if (loading) return <LoadingSpinner />
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#0A1A2F] tracking-wide">
          Room Management
        </h1>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* CATEGORY FILTER */}
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="bg-[#0a1b4d] text-white p-2 rounded-lg w-full sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            {derivedCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* ADD BUTTON */}
          {user?.role === "admin" && (
            <button
              className="px-5 py-2 bg-[#0A1B4D] text-white rounded-lg shadow-md
              hover:bg-[#091642] transition-all whitespace-nowrap"
              onClick={() => setModalOpen(true)}
            >
              Add Room
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-xl font-medium">No rooms found</p>
            <p className="text-sm">Try changing the filter.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={(r) => {
                setEditingRoom(r);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <RoomForm
              initialData={editingRoom}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalOpen(false);
                setEditingRoom(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
