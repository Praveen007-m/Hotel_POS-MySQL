import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ChevronLeft, ChevronRight, LogOut, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 6;

/* ================= FIXED-POSITION ACTIONS MENU ================= */
const ActionsMenu = ({ booking, onDelete, onEdit }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 200;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;
    if (top + 60 > window.innerHeight) top = rect.top - 66;
    setMenuPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    const close = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    if (open) {
      document.addEventListener("mousedown", close);
      document.addEventListener("scroll", onScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        onClick={openMenu}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
          open ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        }`}
        title="Actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 200 }}
          className="menu-appear"
        >
          <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-[0.07] overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); onEdit(booking); }}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-500 group-hover:bg-indigo-200 transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <span className="font-medium">Edit Booking</span>
              </button>

              <button
                onClick={() => { setOpen(false); onDelete(booking.id); }}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-gray-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-500 group-hover:bg-red-200 transition-colors shrink-0">
                  <Trash2 size={13} />
                </span>
                <span className="font-medium">Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


/* ================= STATUS SELECT ================= */
const StatusSelect = ({ value, onChange }) => {
  const styles = {
    "checked-in":  "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300",
    "checked-out": "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-300",
    "cancelled":   "bg-red-50 text-red-700 border-red-200 focus:ring-red-300",
    "confirmed":   "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-300",
  };
  const key = value?.toLowerCase() || "confirmed";
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={onChange}
        className={`appearance-none cursor-pointer pl-2 pr-6 py-1 text-[11px] font-semibold rounded-full border transition-all outline-none focus:ring-2 focus:ring-offset-1 ${styles[key] || styles["confirmed"]}`}
      >
        <option value="Checked-in">Checked-in</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Checked-out">Checked-out</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
        <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

/* ================= STAT CARD ================= */
const StatCard = ({ label, value, color, icon }) => {
  const gradient = {
    blue:   "from-blue-500 to-blue-600",
    green:  "from-emerald-500 to-emerald-600",
    yellow: "from-amber-400 to-amber-500",
    red:    "from-red-500 to-red-600",
  }[color];
  const bg = {
    blue:   "bg-blue-50",
    green:  "bg-emerald-50",
    yellow: "bg-amber-50",
    red:    "bg-red-50",
  }[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.08] rounded-full`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

/* ================= SKELETON ================= */
const SkeletonRows = () =>
  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
    <tr key={i} className="animate-pulse border-b border-gray-100">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="px-3 py-4">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
        </td>
      ))}
    </tr>
  ));

/* ================= BOOKING TABLE ================= */
export default function BookingTable({
  bookings = [],
  loading = false,
  parseAddOns,
  formatDate,
  onDelete,
  onStatusChange,
  onEdit,
}) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);

  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return bookings.slice(start, start + ITEMS_PER_PAGE);
  }, [bookings, page]);

  return (
    <>

      <style>{`
        @keyframes menu-appear {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .menu-appear { animation: menu-appear 0.15s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      <div className="space-y-5">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Bookings" value={bookings.length} color="blue" icon="📋" />
          <StatCard
            label="Checked In"
            value={bookings.filter((b) => b.status?.toLowerCase() === "checked-in").length}
            color="green" icon="🟢"
          />
          <StatCard
            label="Pending"
            value={bookings.filter((b) => b.status?.toLowerCase() === "confirmed").length}
            color="yellow" icon="🟡"
          />
          <StatCard
            label="Cancelled"
            value={bookings.filter((b) => b.status?.toLowerCase() === "cancelled").length}
            color="red" icon="🔴"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="overflow-x-auto lg:overflow-x-visible overflow-y-visible">
            <table className="w-full min-w-[700px] lg:min-w-0 text-sm border-collapse rounded-t-2xl overflow-hidden">

              {/* Header */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                  <th className="px-3 py-3 text-left">Booking ID</th>
                  <th className="px-3 py-3 text-left">Customer</th>
                  <th className="px-3 py-3 text-left">Room</th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Check-in</th>
                  <th className="px-3 py-3 text-left hidden lg:table-cell">Check-out</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">Price</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-center w-[60px]">Actions</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <SkeletonRows />
                ) : paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-5xl">📭</div>
                        <p className="text-gray-400 font-medium">No bookings found</p>
                        <p className="text-gray-300 text-sm">Start by creating your first booking</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking, idx) => {
                    const isHovered    = hoveredRow === booking.id;

                    return (
                      <tr
                        key={booking.id}
                        onMouseEnter={() => setHoveredRow(booking.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`transition-colors duration-150 ${
                          isHovered ? "bg-indigo-50/50" : idx % 2 !== 0 ? "bg-gray-50/30" : "bg-white"
                        }`}
                      >
                        {/* Booking ID */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md tracking-wide font-mono w-fit">
                              #{booking.booking_id}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[110px]">
                              by {booking.created_by_name}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                              {booking.customer_name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-800 capitalize truncate max-w-[90px] text-[12px]">
                              {booking.customer_name}
                            </span>
                          </div>
                        </td>

                        {/* Room */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg w-fit">
                              <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                              {booking.room_number}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {booking.category}
                              </span>
                              <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap">
                                Adv: ₹{booking.advance_paid}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Check-in */}
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">
                              {formatDate(booking.check_in)}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                              Check-in
                            </span>
                          </div>
                        </td>

                        {/* Check-out */}
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">
                              {booking.check_out ? formatDate(booking.check_out) : "N/A"}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                              Check-out
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-3 py-3 hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-bold text-gray-900">
                              ₹{booking.price}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">
                              per night
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <StatusSelect
                            value={booking.status}
                            onChange={(e) => onStatusChange(booking.id, e.target.value)}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                        <ActionsMenu
                          booking={booking}
                          onDelete={onDelete}
                          onEdit={onEdit}
                        />

                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-b-2xl">
            <span className="text-xs text-gray-400 font-medium">
              Showing <span className="text-gray-600 font-semibold">{paginatedBookings.length}</span> of{" "}
              <span className="text-gray-600 font-semibold">{bookings.length}</span> bookings
            </span>

            {/* Inline pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}