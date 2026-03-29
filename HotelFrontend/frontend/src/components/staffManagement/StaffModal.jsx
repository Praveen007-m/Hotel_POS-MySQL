import { useState } from "react";
import auth from "../../auth/axiosInstance";


const StaffModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Staff name is required");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }

    if (!formData.phone) {
      setError("Phone number is required");
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await auth.post("/staff", formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">ADD STAFF</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-800 text-xs p-3 rounded-md animate-pulse">
              {error}
            </div>
          )}

          {/* Row 1: Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staff Name */}
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
                Staff Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* Row 2: Phone & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                inputMode="numeric"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit"
              />
              <p className="text-xs text-gray-500 mt-1">10 digits only</p>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 text-xs font-semibold uppercase tracking-wide"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Staff"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffModal;