import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";

const statuses = ["Available", "Occupied", "Cleaning", "Maintenance"];
const amenitiesList = ["AC", "TV", "WiFi", "Attached Bathroom"];
const addonsList = [];

export default function RoomForm({
  initialData,
  onSubmit,
  onCancel,
  categories = [],
  canManageCategories = false,
  onManageCategories,
}) {
  const [dynamicAddons, setDynamicAddons] = useState([]);
  const categoryOptions = useMemo(
    () =>
      categories.map((category) =>
        typeof category === "string" ? { id: category, name: category } : category
      ),
    [categories]
  );

  const [form, setForm] = useState({
    room_number: "",
    category: "",
    status: "Available",
    price_per_night: "",
    capacity: 2,
    amenities: [],
    add_ons: [],
  });

  useEffect(() => {
    if (initialData) {
      const amenitiesArr = initialData.amenities
        ? Object.keys(initialData.amenities).filter((key) => initialData.amenities[key])
        : [];

      const addOnsArr = initialData.add_ons
        ? Object.keys(initialData.add_ons).filter((key) => initialData.add_ons[key])
        : [];

      setForm({
        room_number: initialData.room_number || "",
        category: initialData.category || categoryOptions[0]?.name || "",
        status: initialData.status || "Available",
        price_per_night: initialData.price_per_night || "",
        capacity: initialData.capacity || 2,
        amenities: amenitiesArr,
        add_ons: addOnsArr,
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      category: prev.category || categoryOptions[0]?.name || "",
    }));
  }, [initialData, categoryOptions]);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/addons`);
        setDynamicAddons(res.data || []);
      } catch (err) {
        console.error("Failed to fetch add-ons", err);
      }
    };

    fetchAddons();
  }, []);

  const toggleArrayValue = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = () => {
    if (!form.room_number.trim()) {
      toast.error("Room number is required");
      return;
    }

    if (!form.category) {
      toast.error("Please select a room category");
      return;
    }

    if (!form.price_per_night || Number(form.price_per_night) < 0) {
      toast.error("Price must be valid");
      return;
    }

    const amenitiesObj = Object.fromEntries(
      amenitiesList.map((item) => [item, form.amenities.includes(item) ? 1 : 0])
    );

    const addOnsObj = Object.fromEntries(
      (dynamicAddons.length ? dynamicAddons.map((item) => item.name) : addonsList).map(
        (item) => [item, form.add_ons.includes(item) ? 1 : 0]
      )
    );

    onSubmit({
      ...form,
      amenities: amenitiesObj,
      add_ons: addOnsObj,
      price_per_night: Number(form.price_per_night),
      capacity: Number(form.capacity),
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {initialData ? "EDIT ROOM" : "ADD NEW ROOM"}
        </h2>
        <div className="mt-2 h-0.5 bg-gradient-to-r from-gray-200 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900">
            Room Number <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter room number"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            value={form.room_number}
            onChange={(e) => setForm({ ...form, room_number: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900">
            Room Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: Number(e.target.value || 0) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-900">
              Category <span className="text-red-500">*</span>
            </label>
            {canManageCategories && onManageCategories && (
              <button
                type="button"
                className="text-[11px] font-semibold uppercase tracking-wide text-[#0A1B4D] hover:text-blue-600"
                onClick={onManageCategories}
              >
                Manage
              </button>
            )}
          </div>

          <select
            className="w-full cursor-pointer appearance-none rounded-md border border-gray-200 bg-white bg-[length:16px] bg-[right_10px_center] bg-no-repeat px-3 py-2 pr-8 text-xs transition-all duration-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={categoryOptions.length === 0}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            }}
          >
            <option value="">
              {categoryOptions.length ? "Select room category" : "No categories available"}
            </option>
            {categoryOptions.map((category) => (
              <option key={category.id || category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          {categoryOptions.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Create a room category before saving a room.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full cursor-pointer appearance-none rounded-md border border-gray-200 bg-white bg-[length:16px] bg-[right_10px_center] bg-no-repeat px-3 py-2 pr-8 text-xs transition-all duration-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            }}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900">
          Price per Night (Rs.) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="Enter price"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          value={form.price_per_night}
          onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wide text-gray-900">
          Amenities <span className="text-xs font-normal text-gray-500">(OPTIONAL)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {amenitiesList.map((item) => (
            <label key={item} className="group flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.amenities.includes(item)}
                onChange={() => toggleArrayValue("amenities", item)}
                className="h-4 w-4 cursor-pointer rounded border border-gray-200 accent-gray-900"
              />
              <span className="text-gray-700 transition-colors group-hover:text-gray-900">
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wide text-gray-900">
          Add-ons <span className="text-xs font-normal text-gray-500">(OPTIONAL)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {(dynamicAddons.length ? dynamicAddons.map((item) => item.name) : addonsList).map(
            (item) => (
              <label key={item} className="group flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.add_ons.includes(item)}
                  onChange={() => toggleArrayValue("add_ons", item)}
                  className="h-4 w-4 cursor-pointer rounded border border-gray-200 accent-gray-900"
                />
                <span className="text-gray-700 transition-colors group-hover:text-gray-900">
                  {item}
                </span>
              </label>
            )
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors duration-200 hover:bg-gray-50 sm:w-auto"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-gray-800 sm:w-auto"
          disabled={categoryOptions.length === 0}
        >
          Save Room
        </button>
      </div>
    </form>
  );
}
