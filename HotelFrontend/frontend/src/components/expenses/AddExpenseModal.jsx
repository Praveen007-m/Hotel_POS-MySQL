import { useEffect, useState } from "react";
import { toast } from 'react-toastify';

const AddExpenseModal = ({ open, onClose, onAdd, loading, error }) => {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    expense_date: "",
  });

  // Close modal on ESC key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (loading) return;

    if (!form.title || !form.amount || !form.expense_date) {
      toast.warning("Title, Amount & Date are required");
      return;
    }

    try {
      await onAdd({
        ...form,
        amount: Number(form.amount),
      });

      // Reset form only on success
      setForm({
        title: "",
        amount: "",
        category: "",
        expense_date: "",
      });

      onClose();
    } catch {
      // error handled in hook
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* MODAL CARD */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#0A1B4D]">
            Add Expense
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Expense Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              placeholder="Enter expense title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Category <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              name="category"
              placeholder="e.g., Food, Travel"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm transition focus:border-[#0A1B4D] focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded bg-[#0A1B4D] text-white hover:bg-[#081341] transition text-sm font-medium disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Add Expense"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;