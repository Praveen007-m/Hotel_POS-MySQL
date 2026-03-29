import { useEffect, useState } from "react";
import auth from "../../auth/axiosInstance";

export default function StaffList({ refreshKey, onDelete }) {
  const [staffs, setStaffs] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    auth.get("/staff").then((res) => setStaffs(res.data));
  }, [refreshKey]);

  const handleDelete = (staffId) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      if (onDelete) onDelete(staffId);
    }
  };

  if (staffs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">👥</div>
          <p className="text-gray-400 font-medium">No staff members found</p>
          <p className="text-gray-300 text-sm">Add staff members to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full min-w-[560px] lg:min-w-0 text-sm border-collapse">

          {/* Header */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
              <th className="px-3 py-3 text-left">Name</th>
              <th className="px-3 py-3 text-left hidden sm:table-cell">Email</th>
              <th className="px-3 py-3 text-left hidden md:table-cell">Phone</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-center w-[70px]">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {staffs.map((s, idx) => (
              <tr
                key={s.id}
                onMouseEnter={() => setHoveredRow(s.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`transition-colors duration-150 ${
                  hoveredRow === s.id
                    ? "bg-indigo-50/50"
                    : idx % 2 !== 0
                    ? "bg-gray-50/30"
                    : "bg-white"
                }`}
              >
                {/* Name */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 capitalize text-[13px] truncate max-w-[120px]">
                      {s.name}
                    </span>
                  </div>
                </td>

                {/* Email */}
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className="text-[12px] text-gray-500 truncate block max-w-[180px]">
                    {s.email || <span className="text-gray-300">—</span>}
                  </span>
                </td>

                {/* Phone */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-[12px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {s.phone || "—"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {s.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleDelete(s.id)}
                      title="Delete staff member"
                      className="group relative w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Delete
                      </div>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">
          <span className="text-gray-600 font-semibold">{staffs.length}</span>{" "}
          {staffs.length === 1 ? "staff member" : "staff members"}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {staffs.filter((s) => s.status === "active").length} active
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            {staffs.filter((s) => s.status !== "active").length} inactive
          </span>
        </div>
      </div>
    </div>
  );
}