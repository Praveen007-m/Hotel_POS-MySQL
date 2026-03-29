import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from 'react-toastify';


const statuses = ["Available", "Occupied", "Cleaning", "Maintenance"];
const roomCategories = ["A frame wooden villa", "Premium room", "Superior room"];
const amenitiesList = ["AC", "TV", "WiFi", "Attached Bathroom"];
const addonsList = [];

export default function RoomForm({ initialData, onSubmit, onCancel }) {
  const [dynamicAddons, setDynamicAddons] = useState([]);
  const [form, setForm] = useState({
    room_number: "",
    category: roomCategories[0],
    status: "Available",
    price_per_night: "",
    capacity: 2,
    amenities: [],
    add_ons: []
  });

  useEffect(() => {
    if (initialData) {
      const amenitiesArr = initialData.amenities
        ? Object.keys(initialData.amenities).filter(k => initialData.amenities[k])
        : [];

      const addOnsArr = initialData.add_ons
        ? Object.keys(initialData.add_ons).filter(k => initialData.add_ons[k])
        : [];

      setForm({
        room_number: initialData.room_number || "",
        category: initialData.category || "",
        status: initialData.status || "Available",
        price_per_night: initialData.price_per_night || "",
        capacity: initialData.capacity || 2,
        amenities: amenitiesArr,
        add_ons: addOnsArr
      });
    }
  }, [initialData]);

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
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = () => {
    if (!form.room_number.trim()) {
      toast.error("Room number is required");
      return;
    }
    if (!form.price_per_night || form.price_per_night < 0) {
      toast.error("Price must be valid");
      return;
    }

    const amenitiesObj = Object.fromEntries(amenitiesList.map(a => [a, form.amenities.includes(a) ? 1 : 0]));
    const addOnsObj = Object.fromEntries(
      (dynamicAddons.length ? dynamicAddons.map(a => a.name) : addonsList)
        .map(a => [a, form.add_ons.includes(a) ? 1 : 0])
    );


    onSubmit({
      ...form,
      amenities: amenitiesObj,
      add_ons: addOnsObj,
      price_per_night: Number(form.price_per_night),
      capacity: Number(form.capacity)
    });
  };

  return (
    <form className="space-y-5">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {initialData ? "EDIT ROOM" : "ADD NEW ROOM"}
        </h2>
        <div className="h-0.5 bg-gradient-to-r from-gray-200 to-transparent mt-2"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Room Number */}
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Room Number <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter room number"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
            value={form.room_number}
            onChange={(e) => setForm({ ...form, room_number: e.target.value })}
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Room Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            className="appearance-none w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none bg-no-repeat bg-[right_10px_center] bg-[length:16px] pr-8 cursor-pointer hover:border-gray-300"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            }}
          >
            {roomCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            className="appearance-none w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none bg-no-repeat bg-[right_10px_center] bg-[length:16px] pr-8 cursor-pointer hover:border-gray-300"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            }}
          >
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        {/* Price */}
        <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
          Price per Night (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          placeholder="Enter price"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          value={form.price_per_night}
          onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
        />
      </div>

      {/* Amenities */}
      <div>
        <label className="text-xs font-semibold text-gray-900 mb-2.5 block uppercase tracking-wide">
          Amenities <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {amenitiesList.map(a => (
            <label key={a} className="flex items-center gap-2 text-xs cursor-pointer group">
              <input
                type="checkbox"
                checked={form.amenities.includes(a)}
                onChange={() => toggleArrayValue("amenities", a)}
                className="w-4 h-4 border border-gray-200 rounded accent-gray-900 cursor-pointer"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <label className="text-xs font-semibold text-gray-900 mb-2.5 block uppercase tracking-wide">
          Add-ons <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {(dynamicAddons.length
            ? dynamicAddons.map(a => a.name)
            : addonsList
          ).map(a => (
            <label key={a} className="flex items-center gap-2 text-xs cursor-pointer group">
              <input
                type="checkbox"
                checked={form.add_ons.includes(a)}
                onChange={() => toggleArrayValue("add_ons", a)}
                className="w-4 h-4 border border-gray-200 rounded accent-gray-900 cursor-pointer"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-xs font-semibold uppercase tracking-wide"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="button"
          className="px-4 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200 text-xs font-semibold uppercase tracking-wide"
          onClick={handleSubmit}
        >
          Save Room
        </button>
      </div>
    </form>
  );
}