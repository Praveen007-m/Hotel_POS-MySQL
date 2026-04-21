import React, { useState } from "react";
import { toast } from 'react-toastify';

/* Validation helpers */
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function CustomerForm({ onSave, onCancel, existing }) {
  const empty = {
    id: null,
    name: "",
    contact: "",
    email: "",
    id_type: "",
    id_number: "",
    id_file: null,
    address: "",
    vehicle_no: "",
    dob: "",
  };

  const [c, setC] = useState(existing || empty);

  const submit = (e) => {
    e.preventDefault();

    // ---------- MANDATORY VALIDATIONS ----------
    if (!c.name.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!c.contact.trim()) {
      toast.error("Contact Number is required");
      return;
    }
    if (!isValidPhone(c.contact)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    // ✅ Email validation ONLY if entered
    if (c.email.trim() && !isValidEmail(c.email)) {
      toast.error("Enter a valid email address");
      return;
    }

    // ---------- FormData ----------
    const formData = new FormData();
    formData.append("name", c.name);
    formData.append("contact", c.contact);
    formData.append("email", c.email || "");
    formData.append("id_type", c.id_type || "");
    formData.append("id_number", c.id_number || "");
    formData.append("address", c.address || "");
    formData.append("vehicle_no", c.vehicle_no || "");
    formData.append("dob", c.dob || "");

    //  IMPORTANT: key name must match multer → upload.single("document")
    if (c.id_file) {
      formData.append("document", c.id_file);
    }

    onSave(formData); // SEND FORMDATA, NOT OBJECT
    setC(empty);
  };

  return (
    <form onSubmit={submit} className="space-y-5">

      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {existing ? "EDIT CUSTOMER" : "ADD NEW CUSTOMER"}
        </h3>
        <div className="h-0.5 bg-gradient-to-r from-gray-200 to-transparent mt-2"></div>
      </div>

      {/* Row 1: Name & Contact */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Enter full name"
            value={c.name}
            onChange={(e) => setC({ ...c, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="10-digit mobile"
            value={c.contact}
            maxLength={10}
            onChange={(e) =>
              setC({ ...c, contact: e.target.value.replace(/\D/g, "") })
            }
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>
      </div>

      {/* Row 2: Email & DOB */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Email <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={c.email}
            onChange={(e) => setC({ ...c, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Date of Birth <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
          </label>
          <input
            type="date"
            value={c.dob}
            onChange={(e) => setC({ ...c, dob: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>
      </div>

      {/* Row 3: ID Type & ID Number */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            ID Proof Type <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
          </label>
          <select
            value={c.id_type}
            onChange={(e) => setC({ ...c, id_type: e.target.value })}
            className="appearance-none w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none bg-no-repeat bg-[right_10px_center] bg-[length:16px] pr-8 cursor-pointer hover:border-gray-300"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            }}
          >
            <option value="">SELECT ID PROOF TYPE</option>
            <option value="Aadhar">AADHAAR CARD</option>
            <option value="PAN">PAN CARD</option>
            <option value="Passport">PASSPORT</option>
            <option value="Driving License">DRIVING LICENSE</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            ID Number <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
          </label>
          <input
            placeholder="Enter ID number"
            value={c.id_number}
            onChange={(e) => setC({ ...c, id_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>
      </div>

      {/* Row 4: Address & Vehicle */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Address <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
          </label>
          <input
            placeholder="Enter address"
            value={c.address}
            onChange={(e) => setC({ ...c, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
            Vehicle Number <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
          </label>
          <input
            placeholder="Enter vehicle number"
            value={c.vehicle_no}
            onChange={(e) => setC({ ...c, vehicle_no: e.target.value })}
            className="w-full px-3 py-2 uppercase border border-gray-200 rounded-md text-xs bg-white transition-all duration-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none placeholder:text-gray-400 hover:border-gray-300"
          />
        </div>
      </div>

      {/* ID Proof Upload */}
      <div>
        <label className="text-xs font-semibold text-gray-900 mb-1.5 block uppercase tracking-wide">
          ID Proof Upload <span className="text-gray-500 font-normal text-xs">(OPTIONAL)</span>
        </label>

        <div className={`border-2 border-dashed rounded-md p-2 transition-all duration-200 ${c.id_file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`}>
          {!c.id_file ? (
            <label className="flex flex-col items-center justify-center cursor-pointer py-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mb-1 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-xs font-semibold text-gray-700">CLICK TO UPLOAD</span>
              <span className="text-xs text-gray-500 mt-0">
                JPG, PNG, PDF (MAX 5MB)
              </span>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) =>
                  setC({ ...c, id_file: e.target.files[0] || null })
                }
              />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-white rounded-md p-2 border border-green-200">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex items-center justify-center bg-gray-800 text-white rounded text-xs font-bold">
                  {c.id_file.name.split('.').pop().toUpperCase().slice(0, 3)}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
                    {c.id_file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(c.id_file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setC({ ...c, id_file: null })}
                className="px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
              >
                REMOVE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition-colors duration-200 hover:bg-gray-50 sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-gray-800 sm:w-auto"
        >
          Save Customer
        </button>
      </div>
    </form>
  );
}
