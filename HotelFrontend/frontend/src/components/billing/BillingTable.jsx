import { useState, useRef, useEffect } from "react";

const formatBillDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ================= THREE DOTS MENU ================= */
const ActionsMenu = ({ bill, gstStatus, onOpen, onDelete, downloaded, onMarkDownloaded, onView }) => {
console.log(`ActionsMenu for #${bill.id}: downloaded=${downloaded}`);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 208; // w-52
    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;
    // If near bottom of viewport, flip upward
    if (top + 140 > window.innerHeight) {
      top = rect.top - 140 - 6;
    }
    setMenuPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const handleGenerate = () => {
    setOpen(false);
    onOpen(bill, gstStatus);
    onMarkDownloaded(bill.id);
  };

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        onClick={openMenu}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${open
          ? "bg-gray-200 text-gray-900"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 208 }}
          className="dropdown-appear"
        >
          <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-[0.07] overflow-hidden">
            <div className="py-1">

              {/* Generate / Re-generate — primary action */}
              <button
                onClick={handleGenerate}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors shrink-0">
                  {downloaded ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                </span>
                <span className="font-medium">
                  {downloaded ? "Generate Again" : "Generate Bill"}
                </span>
              </button>

              {/* Delete — only when Without GST */}
              {gstStatus === "Without GST" && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => {
                      setOpen(false);
                      if (!window.confirm(`Delete bill #${bill.id}?`)) return;
                      onDelete(bill.id);
                    }}
                    className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-500 group-hover:bg-red-200 transition-colors shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </span>
                    <span className="font-medium">Delete Bill</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= GST BADGE SELECT ================= */
const GstSelect = ({ value, onChange }) => (
  <div className="relative inline-block">
    <select
      value={value}
      onChange={onChange}
      className={`appearance-none cursor-pointer pl-2 pr-6 py-1 text-[11px] font-semibold rounded-full border transition-all outline-none focus:ring-2 focus:ring-offset-1 ${value === "With GST"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300"
        : "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-300"
        }`}
    >
      <option value="With GST">With GST</option>
      <option value="Without GST">Without GST</option>
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
      <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

/* ================= BILLING TABLE ================= */
const BillingTable = ({ billings = [], onOpen, onDelete, rowGstStatus = {}, onGstStatusChange, onMarkDownloaded, onView }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (!onOpen || typeof onOpen !== "function") {
    console.error("BillingTable: onOpen prop is required and must be a function");
    return null;
  }

  if (!billings || billings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">📭</div>
          <p className="text-gray-400 font-medium">No bills found</p>
          <p className="text-gray-300 text-sm">Bills will appear here once created</p>
        </div>
      </div>
    );
  }

  if (!onDelete || typeof onDelete !== "function") {
    console.error("BillingTable: onDelete prop is required");
  }

  const downloadedCount = billings.filter((b) => b.is_downloaded).length;

  return (
    <>
      <style>{`
        @keyframes dropdown-appear {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dropdown-appear { animation: dropdown-appear 0.15s cubic-bezier(0.16,1,0.3,1) forwards; }

        @keyframes badge-pop {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        .badge-pop { animation: badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Scrollable on small screens only */}
        <div className="overflow-x-auto lg:overflow-x-visible overflow-y-visible">
          <table className="w-full min-w-[700px] lg:min-w-0 text-sm border-collapse rounded-t-2xl overflow-hidden">

            {/* ── Header ── */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                <th className="px-3 py-3 text-left w-[90px]">Bill ID</th>
                <th className="px-3 py-3 text-left hidden sm:table-cell">Booking ID</th>
                <th className="px-3 py-3 text-left">Customer</th>
                <th className="px-3 py-3 text-left hidden md:table-cell w-[70px]">Room</th>
                <th className="px-3 py-3 text-left w-[110px]">Date</th>
                <th className="px-3 py-3 text-left hidden lg:table-cell">Advance</th>
                <th className="px-3 py-3 text-left hidden lg:table-cell">Billed By</th>
                <th className="px-3 py-3 text-left w-[90px]">Total</th>
                <th className="px-3 py-3 text-left w-[100px]">GST</th>
                <th className="px-3 py-3 text-center w-[60px]">Actions</th>
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody className="divide-y divide-gray-100">
              {billings.map((b, idx) => {
                const isHovered = hoveredRow === b.id;
                const isDownloaded = !!b.is_downloaded;

                return (
                  <tr
                    key={b.id}
                    onMouseEnter={() => setHoveredRow(b.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`transition-colors duration-150 ${isHovered
                      ? "bg-indigo-50/50"
                      : idx % 2 !== 0
                        ? "bg-gray-50/30"
                        : "bg-white"
                      }`}
                  >
                    {/* Bill ID + Generated badge stacked */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md tracking-wide font-mono w-fit">
                          #{b.id}
                        </span>
                        {isDownloaded && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full w-fit badge-pop"
                              title="Invoice Generated"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              Generated
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Booking ID */}
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded-md truncate block max-w-[130px]">
                        {b.booking_id}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                          {b.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 capitalize truncate max-w-[90px] text-[12px]">
                          {b.customer_name}
                        </span>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
                        <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        {b.room_number || "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">
                          {formatBillDate(b.created_at)}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                          Created
                        </span>
                      </div>
                    </td>

                    {/* Advance */}
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-bold text-gray-800">
                          ₹{Number(b.advance_paid || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">
                          paid
                        </span>
                      </div>
                    </td>

                    {/* Billed By */}
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">
                          {b.billed_by_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-medium text-gray-700 truncate max-w-[75px]">
                            {b.billed_by_name || "—"}
                          </span>
                          {b.billed_by_role === "staff" && (
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              Staff
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-bold text-gray-900 whitespace-nowrap">
                          ₹{Number(b.total_amount || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">
                          total
                        </span>
                      </div>
                    </td>

                    {/* GST */}
                    <td className="px-3 py-3">
                      <GstSelect
                        value={rowGstStatus[b.id] || "With GST"}
                        onChange={(e) => onGstStatusChange(b.id, e.target.value)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <ActionsMenu
                        bill={b}
                        gstStatus={rowGstStatus[b.id] || "With GST"}
                        onOpen={onOpen}
                        onDelete={onDelete}
                        downloaded={isDownloaded}
                        onMarkDownloaded={onMarkDownloaded}
                        onView={onView}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            Showing{" "}
            <span className="text-gray-600 font-semibold">{billings.length}</span>{" "}
            {billings.length === 1 ? "record" : "records"}
          </span>
          {downloadedCount > 0 && (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {downloadedCount} bill{downloadedCount > 1 ? "s" : ""} generated
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default BillingTable;