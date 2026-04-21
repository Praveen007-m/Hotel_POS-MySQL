import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import RoomCard from "./RoomCard";
import RoomForm from "./RoomForm";
import RoomCategoryManager from "./RoomCategoryManager";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../common/LoadingSpinner";

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [roomCategories, setRoomCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState("rooms");

  const { user } = useAuth();
  const API_ROOMS = `${API_BASE_URL}/api/rooms`;
  const API_ROOM_CATEGORIES = `${API_BASE_URL}/api/rooms/categories`;

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomError("");
    try {
      const res = await axios.get(API_ROOMS);
      setRooms(res.data || []);
    } catch (err) {
      console.error(err);
      setRoomError("Failed to fetch rooms");
    } finally {
      setRoomsLoading(false);
    }
  }, [API_ROOMS]);

  const fetchRoomCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoryError("");
    try {
      const res = await axios.get(API_ROOM_CATEGORIES);
      setRoomCategories(res.data || []);
    } catch (err) {
      console.error(err);
      setCategoryError("Failed to fetch room categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, [API_ROOM_CATEGORIES]);

  useEffect(() => {
    fetchRooms();
    fetchRoomCategories();
  }, [fetchRooms, fetchRoomCategories]);

  const fallbackCategories = useMemo(() => {
    return Array.from(new Set(rooms.map((room) => room.category).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        id: name,
        name,
        room_count: rooms.filter((room) => room.category === name).length,
      }));
  }, [rooms]);

  const availableCategories = roomCategories.length ? roomCategories : fallbackCategories;

  const filteredRooms = useMemo(() => {
    if (selectedCategory === "ALL") {
      return rooms;
    }
    return rooms.filter((room) => room.category === selectedCategory);
  }, [rooms, selectedCategory]);

  const roomTabs =
    user?.role === "admin"
      ? [
          { id: "rooms", label: "Rooms" },
          { id: "categories", label: "Categories" },
        ]
      : [{ id: "rooms", label: "Rooms" }];

  const closeRoomModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
  };

  const handleRoomSubmit = async (roomData) => {
    try {
      if (editingRoom) {
        await axios.put(`${API_ROOMS}/${editingRoom.id}`, roomData);
      } else {
        await axios.post(API_ROOMS, roomData);
      }

      closeRoomModal();
      await Promise.all([fetchRooms(), fetchRoomCategories()]);
      toast.success(editingRoom ? "Room updated successfully" : "Room added successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save room");
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Delete this room?")) {
      return;
    }

    try {
      await axios.delete(`${API_ROOMS}/${id}`);
      await Promise.all([fetchRooms(), fetchRoomCategories()]);
      toast.success("Room deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete room");
    }
  };

  const handleCreateCategory = async (name) => {
    await axios.post(API_ROOM_CATEGORIES, { name });
    await fetchRoomCategories();
  };

  const handleUpdateCategory = async (id, name) => {
    const current = availableCategories.find((category) => String(category.id) === String(id));
    await axios.put(`${API_ROOM_CATEGORIES}/${id}`, { name });
    await Promise.all([fetchRoomCategories(), fetchRooms()]);

    if (current?.name === selectedCategory) {
      setSelectedCategory(name);
    }
  };

  const handleDeleteCategory = async (id) => {
    const current = availableCategories.find((category) => String(category.id) === String(id));
    await axios.delete(`${API_ROOM_CATEGORIES}/${id}`);
    await fetchRoomCategories();

    if (current?.name === selectedCategory) {
      setSelectedCategory("ALL");
    }
  };

  const handleOpenCategoryManager = () => {
    closeRoomModal();
    setActiveTab("categories");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-wide text-[#0A1A2F] md:text-3xl">
            Room Management
          </h1>

          {activeTab === "rooms" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg bg-[#0A1B4D] p-2.5 text-white sm:w-auto"
                disabled={categoriesLoading && availableCategories.length === 0}
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category.id || category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              {user?.role === "admin" && (
                <button
                  className="whitespace-nowrap rounded-lg bg-[#0A1B4D] px-5 py-2.5 text-white shadow-md transition-all hover:bg-[#091642]"
                  onClick={() => {
                    setEditingRoom(null);
                    setModalOpen(true);
                  }}
                >
                  Add Room
                </button>
              )}
            </div>
          )}
        </div>

        {roomTabs.length > 1 && (
          <div className="grid grid-cols-2 gap-3 sm:inline-flex sm:w-auto">
            {roomTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:text-base ${
                  activeTab === tab.id
                    ? "bg-[#0A1B4D] text-white shadow-lg"
                    : "border border-gray-200 bg-white text-[#0A1B4D] hover:shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "categories" ? (
        <RoomCategoryManager
          categories={availableCategories}
          loading={categoriesLoading}
          error={categoryError}
          canManage={user?.role === "admin"}
          onRefresh={fetchRoomCategories}
          onCreate={handleCreateCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
        />
      ) : roomsLoading ? (
        <LoadingSpinner />
      ) : roomError ? (
        <p className="text-red-600">{roomError}</p>
      ) : filteredRooms.length === 0 ? (
        <div className="mt-20 text-center text-gray-500">
          <p className="text-xl font-medium">No rooms found</p>
          <p className="text-sm">Try changing the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={(selectedRoom) => {
                setEditingRoom(selectedRoom);
                setModalOpen(true);
              }}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6">
            <button
              type="button"
              onClick={closeRoomModal}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close room form"
            >
              <X size={18} />
            </button>

            <RoomForm
              initialData={editingRoom}
              onSubmit={handleRoomSubmit}
              onCancel={closeRoomModal}
              categories={availableCategories}
              canManageCategories={user?.role === "admin"}
              onManageCategories={handleOpenCategoryManager}
            />
          </div>
        </div>
      )}
    </div>
  );
}
