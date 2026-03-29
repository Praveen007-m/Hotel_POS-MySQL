import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from 'react-toastify';
import { Plus, Trash2, Tags, Loader, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [error, setError] = useState(null);
  const { user } = useAuth();

  /* ================= FETCH ================= */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${API_BASE_URL}/api/kitchen/categories`
      );
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch categories");
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ================= OPTIMISTIC ADD ================= */
  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) {
      toast.warning("Please enter a category name");
      return;
    }

    // temporary optimistic category
    const tempCategory = {
      id: `temp-${Date.now()}`,
      name,
      optimistic: true,
    };

    // optimistic UI update
    setCategories((prev) => [...prev, tempCategory]);
    setNewCategory("");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/kitchen/categories`,
        { name }
      );

      // replace temp with real category from backend
      setCategories((prev) =>
        prev.map((c) =>
          c.id === tempCategory.id ? res.data : c
        )
      );

      toast.success("Category added successfully");
    } catch (err) {
      console.error(err);

      // rollback on failure
      setCategories((prev) =>
        prev.filter((c) => c.id !== tempCategory.id)
      );

      toast.error(err.response?.data?.message || "Failed to add category");
    }
  };

  /* ================= OPTIMISTIC DELETE ================= */
  const removeCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    // backup for rollback
    const previousCategories = categories;

    // optimistic remove
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeletingIds((prev) => new Set([...prev, id]));

    try {
      await axios.delete(
        `${API_BASE_URL}/api/kitchen/categories/${id}`
      );

      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      toast.success("Category deleted successfully");
    } catch (err) {
      console.error(err);

      // rollback
      setCategories(previousCategories);

      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addCategory();
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <Tags className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Organize your menu items by category</p>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchCategories}
              className="text-red-600 hover:text-red-700 text-sm font-medium mt-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Add Category Section */}
      {user?.role === "admin" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Add New Category
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter category name (e.g., Appetizers, Main Courses)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 border border-blue-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <button
              onClick={addCategory}
              disabled={!newCategory.trim() || loading}
              className="group relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && categories.length === 0 && (
        <LoadingSpinner text="Loading categories..." />
      )}

      {/* Empty State */}
      {!loading && categories.length === 0 && !error && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <Tags className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">No categories yet</p>
          <p className="text-gray-500 text-sm mt-2">Create your first category to get started</p>
        </div>
      )}

      {/* Category List */}
      {!loading && categories.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-semibold text-gray-700">
              {categories.filter(c => !c.optimistic).length} {categories.filter(c => !c.optimistic).length === 1 ? 'Category' : 'Categories'}
            </p>
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-300 to-transparent rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${c.optimistic
                  ? "opacity-60 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                  : "bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200/50"
                  }`}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Background gradient effect */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-500"></div>

                <div className="relative p-4 flex items-center justify-between h-full">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Tags className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                        {c.name}
                      </p>
                      {c.optimistic && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Loader className="w-3 h-3 animate-spin" />
                          Adding...
                        </p>
                      )}
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => removeCategory(c.id)}
                      disabled={c.optimistic || deletingIds.has(c.id)}
                      className="ml-2 flex-shrink-0 p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}