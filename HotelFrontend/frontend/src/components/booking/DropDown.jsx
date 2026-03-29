import { useState, useRef, useEffect } from "react";

const STATUS_OPTIONS = [
  { label: "All Status", value: "ALL" },
  { label: "Checked-in", value: "Checked-in" },
  { label: "Cancelled", value: "Cancelled" },
];

export default function StatusDropdown({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected =
    STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 px-4 py-2 bg-[#0A1B4D] text-white rounded-xl shadow-md hover:bg-[#091642] transition-all w-full sm:min-w-[180px]"
      >
        <span className="font-medium">{selected.label}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-full bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors
                ${value === opt.value
                  ? "bg-[#0A1B4D] text-white"
                  : "hover:bg-gray-100 text-gray-800"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
