import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, FileText, Trash2 } from "lucide-react";

/* ================= FIXED-POSITION ACTIONS MENU ================= */
const ActionsMenu = ({ group, generatingBill, generateBill, handleDelete, isDownloaded, user }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;
    if (top + 120 > window.innerHeight) top = rect.top - 120 - 8;
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
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${open ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 180 }}
          className="menu-appear"
        >
          <div className="rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden border border-gray-100">
            <div className="py-1.5 px-1.5">
              <button
                onClick={() => { setOpen(false); generateBill(group.identifier, group); }}
                disabled={generatingBill}
                className="group flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 disabled:opacity-40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                  <FileText size={14} />
                </span>
                <span className="font-semibold flex items-center gap-1.5">
                  {generatingBill ? "Processing..." : isDownloaded ? "Regenerate" : "Generate Bill"}
                  {isDownloaded && <CheckCircle size={11} className="text-emerald-500" />}
                </span>
              </button>

              {user?.role === "admin" && (
                <>
                  <div className="my-1.5 mx-2 border-t border-gray-100" />

                  <button
                    onClick={() => {
                      setOpen(false);
                      if (window.confirm("Delete this table's orders?")) handleDelete(group.identifier);
                    }}
                    className="group flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </span>
                    <span className="font-semibold">Delete Orders</span>
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

/* ================= SERVED ORDERS TABLE ================= */
export default function ServedOrdersTable({
  orderMode,
  servedOrdersGrouped,
  prevPage,
  setPrevPage,
  totalServedPages,
  generatingBill,
  generateBill,
  paginate,
  handleDelete,
  downloadedBills,
  user,
}) {
  const isRestaurant = orderMode === "restaurant";

  return (
    <>
      <style>{`
        @keyframes menu-appear {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .menu-appear { animation: menu-appear 0.15s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-gray-800">
            Served Orders — Ready for Billing
          </h2>
          <span className="ml-1 text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {servedOrdersGrouped.length}
          </span>
        </div>

        {servedOrdersGrouped.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="text-5xl">✅</div>
            <p className="text-gray-400 font-medium">No served orders</p>
            <p className="text-gray-300 text-sm">Served orders will appear here for billing</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full min-w-[640px] lg:min-w-0 text-sm border-collapse">

                {/* Header */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                    <th className="px-3 py-3 text-left">{isRestaurant ? "Table" : "Room"}</th>
                    {!isRestaurant && <th className="px-3 py-3 text-left hidden md:table-cell">Guest</th>}
                    <th className="px-3 py-3 text-left">Items</th>
                    <th className="px-3 py-3 text-right hidden sm:table-cell">Subtotal</th>
                    <th className="px-3 py-3 text-right hidden lg:table-cell">Tax (5%)</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-center w-[60px]">Actions</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-gray-100">
                  {paginate(servedOrdersGrouped, prevPage).map((group, idx) => {
                    const subtotal = group.orders.reduce((sum, o) => sum + o.quantity * o.price, 0);
                    const tax = subtotal * 0.05;
                    const total = subtotal + tax;
                    const isDownloaded = downloadedBills?.has(group.identifier);

                    return (
                      <tr
                        key={group.identifier}
                        className={`transition-colors duration-150 ${idx % 2 !== 0 ? "bg-gray-50/30" : "bg-white"
                          } hover:bg-indigo-50/50`}
                      >
                        {/* Table / Room */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono w-fit">
                              #{isRestaurant ? `Table ${group.identifier}` : `Booking ${group.identifier}`}
                            </span>
                            {isDownloaded && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full w-fit">
                                <CheckCircle size={9} />
                                Generated
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Guest (hotel only) */}
                        {!isRestaurant && (
                          <td className="px-3 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {group.orders[0]?.customer_name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-semibold text-gray-700 capitalize">{group.orders[0]?.customer_name}</span>
                                <span className="text-[9px] text-gray-400 font-mono">#{group.orders[0]?.booking_id}</span>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Items */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-0.5">
                            {group.orders.map((o, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className="text-[12px] text-gray-700">{o.item_name}</span>
                                <span className="text-[10px] text-gray-400 font-medium">×{o.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="px-3 py-3 text-right hidden sm:table-cell">
                          <span className="text-[12px] text-gray-500">₹{subtotal.toFixed(2)}</span>
                        </td>

                        {/* Tax */}
                        <td className="px-3 py-3 text-right hidden lg:table-cell">
                          <span className="text-[12px] text-gray-500">₹{tax.toFixed(2)}</span>
                        </td>

                        {/* Total */}
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[13px] font-bold text-emerald-700">₹{total.toFixed(2)}</span>
                            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">total</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <ActionsMenu
                            group={group}
                            generatingBill={generatingBill}
                            generateBill={generateBill}
                            handleDelete={handleDelete}
                            isDownloaded={isDownloaded}
                            user={user}
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
                <span className="text-gray-600 font-semibold">
                  {paginate(servedOrdersGrouped, prevPage).length}
                </span>{" "}
                of{" "}
                <span className="text-gray-600 font-semibold">{servedOrdersGrouped.length}</span> groups
              </span>

              {totalServedPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={prevPage === 1}
                    onClick={() => setPrevPage(prevPage - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    {prevPage} / {totalServedPages}
                  </span>
                  <button
                    disabled={prevPage === totalServedPages}
                    onClick={() => setPrevPage(prevPage + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}