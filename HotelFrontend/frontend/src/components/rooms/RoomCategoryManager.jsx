import { useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { toast } from "react-toastify";

export default function RoomCategoryManager({
  categories,
  loading,
  error,
  canManage,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const name = newCategory.trim();
    if (!name) {
      toast.warning("Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      await onCreate(name);
      setNewCategory("");
      toast.success("Room category added");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add room category");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    const name = editingName.trim();
    if (!name) {
      toast.warning("Please enter a category name");
      return;
    }

    setActiveId(editingId);
    try {
      await onUpdate(editingId, name);
      toast.success("Room category updated");
      cancelEdit();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update room category");
    } finally {
      setActiveId(null);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}" category?`)) {
      return;
    }

    setActiveId(category.id);
    try {
      await onDelete(category.id);
      toast.success("Room category deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete room category");
    } finally {
      setActiveId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading room categories..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-fit rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3">
          <Tags className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Room Categories
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Manage the room types available in your property
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {canManage && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6"
        >
          <label className="mb-3 block text-sm font-semibold text-gray-700 sm:text-base">
            Add New Room Category
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="min-w-0 w-full flex-1 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
            />
            <button
              type="submit"
              disabled={!newCategory.trim() || saving}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              {saving ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
      )}

      {sortedCategories.length === 0 && !error ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
            <Tags className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-gray-700">No room categories yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Create your first room category to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700 sm:text-base">
              {sortedCategories.length}{" "}
              {sortedCategories.length === 1 ? "Category" : "Categories"}
            </p>
            <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-blue-300 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {sortedCategories.map((category) => {
              const isEditing = editingId === category.id;
              const isBusy = activeId === category.id;
              const isLocked = Number(category.room_count || 0) > 0;

              return (
                <div
                  key={category.id}
                  className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Tags className="h-5 w-5 text-white" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={!editingName.trim() || isBusy}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A1B4D] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="break-words text-lg font-semibold leading-tight text-gray-900">
                              {category.name}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {Number(category.room_count || 0)}{" "}
                              {Number(category.room_count || 0) === 1 ? "room" : "rooms"}
                            </p>
                            {isLocked && (
                              <p className="mt-2 text-xs text-amber-600">
                                Remove or rename assigned rooms before deleting this category.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {!isEditing && canManage && (
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          disabled={isBusy}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Edit category"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PencilLine className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={isBusy || isLocked}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            isLocked
                              ? "Rooms are still assigned to this category"
                              : "Delete category"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
