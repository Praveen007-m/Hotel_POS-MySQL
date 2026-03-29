import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from 'react-toastify';

const statuses = ["Available", "Out of Stock"];

export default function MenuForm({ initialData, onSubmit, onCancel }) {
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    status: "Available",
  });

  /* ================= LOAD CATEGORIES ================= */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/kitchen/categories`
        );
        setCategories(res.data);

        // set default category for new item
        if (!initialData && res.data.length > 0) {
          setForm((prev) => ({
            ...prev,
            category: res.data[0].name,
          }));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, [initialData]);

  /* ================= LOAD EDIT DATA ================= */
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        category: initialData.category,
        price: initialData.price,
        stock: initialData.stock,
        status: initialData.status,
      });
    }
  }, [initialData]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name || !form.price || form.stock === "") {
      return toast.warning("Please fill all fields");
    }

    try {
      if (initialData) {
        await axios.put(
          `${API_BASE_URL}/api/kitchen/items/${initialData.id}`,
          form
        );
        toast.success("Menu item updated");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/kitchen/items`,
          form
        );
        toast.success("Menu item added");
      }

      onSubmit(); // close modal & refresh list
    } catch (err) {
      console.error(err);
      toast.error("Failed to save menu item");
    }
  };

  /* ================= UI ================= */
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#0A1A2F] mb-5">
        {initialData ? "Edit Menu Item" : "Add Menu Item"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Name */}
        <div>
          <label className="text-sm text-gray-600">Item Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm text-gray-600">Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg mt-1"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-sm text-gray-600">Price</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="text-sm text-gray-600">Stock</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) =>
              setForm({ ...form, stock: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg mt-1"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-sm text-gray-600">Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg mt-1"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#0A1B4D] text-white rounded-lg hover:bg-[#091642]"
        >
          Save Item
        </button>
      </div>
    </div>
  );
}
