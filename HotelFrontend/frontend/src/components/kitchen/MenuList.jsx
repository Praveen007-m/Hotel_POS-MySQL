import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import {
  Edit2,
  Trash2,
  TrendingUp,
  AlertCircle,
  Loader,
  UtensilsCrossed,
  Package,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  Database,
  Plus
} from "lucide-react";

export default function MenuList({ onEdit, onAdd }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const { user } = useAuth();

  /**
   * Fetch menu items from API
   */
  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/kitchen/items`);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch menu on component mount
   */
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  /**
   * Optimistic delete with rollback
   * Updates UI immediately, rolls back if API fails
   */
  const handleDelete = useCallback(
    async (id) => {
      if (!confirm("Are you sure you want to delete this item?")) return;

      const previousItems = menuItems;

      try {
        // Mark as deleting
        setDeletingIds((prev) => new Set([...prev, id]));

        // Optimistic update: Remove from UI immediately
        setMenuItems((prev) => prev.filter((item) => item.id !== id));

        // Make API call
        await axios.delete(`${API_BASE_URL}/api/kitchen/items/${id}`);

        // Success - remove from deleting set
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        toast.success("Item deleted successfully");
      } catch (err) {
        console.error("Delete error:", err);

        // Rollback on error
        setMenuItems(previousItems);

        // Remove from deleting set
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });

        setError(
          err.response?.data?.message || "Failed to delete menu item"
        );
        toast.error(
          err.response?.data?.message || "Failed to delete menu item"
        );
      }
    },
    [menuItems]
  );

  if (loading) {
    return <LoadingSpinner text="Loading menu items..." />;
  }

  if (error && menuItems.length === 0) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Menu</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={fetchMenu}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 hover:shadow-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!menuItems.length) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your restaurant menu</p>
          </div>
          {user?.role === "admin" && (
            <button
              onClick={onAdd}
              className="group relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Menu Item
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          )}
        </div>
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl border border-gray-200 backdrop-blur-sm">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-700 text-xl font-semibold">No menu items added yet</p>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            Start building your menu by clicking "Add Menu Item" to create your first culinary masterpiece
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your restaurant menu</p>
        </div>

      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Items</p>
              <p className="text-4xl font-bold">{menuItems.length}</p>
            </div>
            <Database className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">In Stock</p>
              <p className="text-4xl font-bold">{menuItems.filter(i => i.stock > 0).length}</p>
            </div>
            <Package className="w-12 h-12 opacity-20" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Available</p>
              <p className="text-4xl font-bold">{menuItems.filter(i => i.status === "Available").length}</p>
            </div>
            <Zap className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group relative h-full bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 ${deletingIds.has(item.id)
              ? "opacity-50 pointer-events-none bg-gradient-to-br from-red-50 to-rose-50"
              : ""
              }`}
          >
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Background gradient effect */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700"></div>

            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              {deletingIds.has(item.id) ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold animate-pulse">
                  <Loader className="w-3 h-3 animate-spin" />
                  Deleting...
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all ${item.status === "Available"
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                    : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                    }`}
                >
                  {item.status === "Available" ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {item.status}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      {item.status}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Item Header */}
              <div className="flex-1 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1 pr-4">
                    <div className="flex-shrink-0 mt-1">
                      <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {item.name}
                      </h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        {item.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price with gradient */}
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
                      Price
                    </p>
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ₹{Number(item.price).toFixed(2)}
                  </p>
                </div>

                {/* Stock and Status Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border transition-all ${item.stock > 0
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                    }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Package className={`w-4 h-4 ${item.stock > 0 ? "text-green-600" : "text-red-600"}`} />
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Stock
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${item.stock > 0 ? "text-green-700" : "text-red-700"
                      }`}>
                      {item.stock}
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border transition-all ${item.status === "Available"
                    ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                    : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                    }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.status === "Available" ? (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-orange-600" />
                      )}
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Available
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${item.status === "Available" ? "text-blue-700" : "text-orange-700"
                      }`}>
                      {item.status === "Available" ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {user?.role === "admin" && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(item)}
                    disabled={deletingIds.has(item.id)}
                    className="flex-1 relative overflow-hidden group/edit px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover/edit:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingIds.has(item.id)}
                    className="flex-1 relative overflow-hidden group/del px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      {deletingIds.has(item.id) ? "..." : "Delete"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-700 opacity-0 group-hover/del:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom glow effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        ))}
      </div>
    </div>
  );
}