import React, { useState } from "react";
import { toast } from "react-toastify";
import { Upload, X, FileText } from "lucide-react";

/* Validation helpers */
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── FIELD COMPONENTS ────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 hover:border-gray-300 ${className}`}
      {...props}
    />
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
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

  const set = (key) => (e) => setC((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();

    if (!c.name.trim()) { toast.error("Full Name is required"); return; }
    if (!c.contact.trim()) { toast.error("Contact Number is required"); return; }
    if (!isValidPhone(c.contact)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    if (c.email.trim() && !isValidEmail(c.email)) { toast.error("Enter a valid email address"); return; }

    const formData = new FormData();
    formData.append("name", c.name);
    formData.append("contact", c.contact);
    formData.append("email", c.email || "");
    formData.append("id_type", c.id_type || "");
    formData.append("id_number", c.id_number || "");
    formData.append("address", c.address || "");
    formData.append("vehicle_no", c.vehicle_no || "");
    formData.append("dob", c.dob || "");
    if (c.id_file) formData.append("document", c.id_file);

    onSave(formData);
    setC(empty);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">

      {/* ── Title ── */}
      <div>
        <h3 className="text-base font-bold text-gray-900">
          {existing ? "Edit Customer" : "Add New Customer"}
        </h3>
        <div className="mt-1.5 h-px bg-gradient-to-r from-gray-200 to-transparent" />
      </div>

      {/* ── Row 1: Name & Contact ── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={<>Full Name <span className="text-red-500 normal-case">*</span></>}>
          <Input
            placeholder="Enter full name"
            value={c.name}
            onChange={set("name")}
          />
        </Field>
        <Field label={<>Contact <span className="text-red-500 normal-case">*</span></>}>
          <Input
            placeholder="10-digit mobile"
            value={c.contact}
            maxLength={10}
            onChange={(e) => setC({ ...c, contact: e.target.value.replace(/\D/g, "") })}
          />
        </Field>
      </div>

      {/* ── Row 2: Email & DOB ── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email (optional)">
          <Input
            type="email"
            placeholder="example@email.com"
            value={c.email}
            onChange={set("email")}
          />
        </Field>
        <Field label="Date of Birth (optional)">
          <Input
            type="date"
            value={c.dob}
            onChange={set("dob")}
          />
        </Field>
      </div>

      {/* ── Row 3: ID Type & ID Number ── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="ID Proof Type (optional)">
          <div className="relative">
            <select
              value={c.id_type}
              onChange={set("id_type")}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 hover:border-gray-300 cursor-pointer pr-8"
            >
              <option value="">Select type</option>
              <option value="Aadhar">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </Field>
        <Field label="ID Number (optional)">
          <Input
            placeholder="Enter ID number"
            value={c.id_number}
            onChange={set("id_number")}
          />
        </Field>
      </div>

      {/* ── Row 4: Address & Vehicle ── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Address (optional)">
          <Input
            placeholder="Enter address"
            value={c.address}
            onChange={set("address")}
          />
        </Field>
        <Field label="Vehicle Number (optional)">
          <Input
            placeholder="e.g. TN01AB1234"
            value={c.vehicle_no}
            onChange={(e) => setC({ ...c, vehicle_no: e.target.value.toUpperCase() })}
            className="uppercase"
          />
        </Field>
      </div>

      {/* ── ID Proof Upload ── */}
      <Field label="ID Proof Upload (optional)">
        {!c.id_file ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-5 transition hover:border-gray-300 hover:bg-gray-100">
            <Upload size={18} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600">Click to Upload</span>
            <span className="text-[11px] text-gray-400">JPG, PNG, PDF · Max 5MB</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
              onChange={(e) => setC({ ...c, id_file: e.target.files[0] || null })}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-800 text-white">
                <FileText size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-900">
                  {c.id_file.name}
                </p>
                <p className="text-[11px] text-gray-500">
                  {(c.id_file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setC({ ...c, id_file: null })}
              className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-400 transition hover:bg-red-100 hover:text-red-600"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </Field>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-gray-700 active:scale-95"
        >
          Save Customer
        </button>
      </div>
    </form>
  );
}
