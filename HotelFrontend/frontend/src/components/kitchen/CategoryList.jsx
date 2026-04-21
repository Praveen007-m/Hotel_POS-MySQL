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
  const [isAdding, setIsAdding] = useState(false);
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
    if (!name || isAdding) {
      if (isAdding) return;
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
    setIsAdding(true);

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
    } finally {
      setIsAdding(false);
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

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addCategory();
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-fit rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3">
          <Tags className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Menu Categories</h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">Organize your menu items by category</p>
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
        <form
          onSubmit={handleAddSubmit}
          className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6"
        >
          <label className="mb-3 block text-sm font-semibold text-gray-700 sm:text-base">
            Add New Category
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Enter category name (e.g., Appetizers, Main Courses)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="min-w-0 w-full flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
            />
            <button
              type="submit"
              disabled={!newCategory.trim() || isAdding}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
            >
              {isAdding ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {isAdding ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
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
          <div className="mb-4 flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700 sm:text-base">
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

                <div className="relative flex h-full items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Tags className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-base font-semibold leading-tight text-gray-900 transition-colors duration-300 group-hover:text-blue-600 sm:text-lg">
                        {c.name}
                      </p>
                      {c.optimistic && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <Loader className="h-3 w-3 animate-spin" />
                          Adding...
                        </p>
                      )}
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => removeCategory(c.id)}
                      disabled={c.optimistic || deletingIds.has(c.id)}
                      className="ml-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 group/delete"
                      title="Delete category"
                    >
                      <Trash2 className="h-5 w-5" />
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
