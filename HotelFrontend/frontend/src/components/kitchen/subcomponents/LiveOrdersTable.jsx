import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "../../common/LoadingSpinner";

/* ================= STATUS SELECT ================= */
const StatusSelect = ({ value, onChange }) => {
  const styles = {
    Pending:   "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-300",
    Preparing: "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-300",
    Served:    "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300",
  };

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={onChange}
        className={`appearance-none cursor-pointer pl-2 pr-6 py-1 text-[11px] font-semibold rounded-full border transition-all outline-none focus:ring-2 focus:ring-offset-1 ${styles[value] || styles.Pending}`}
      >
        <option value="Pending">Pending</option>
        <option value="Preparing">Preparing</option>
        <option value="Served">Served</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
        <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

/* ================= LIVE ORDERS TABLE ================= */
export default function LiveOrdersTable({
  orderMode,
  liveOrders,
  loading,
  livePage,
  setLivePage,
  totalLivePages,
  updateStatus,
  paginate,
}) {
  const isRestaurant = orderMode === "restaurant";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <span className="text-xl">🕐</span>
        <h2 className="text-sm font-bold text-gray-800">
          Live {isRestaurant ? "Restaurant" : "Kitchen"} Orders
        </h2>
        {!loading && (
          <span className="ml-1 text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {liveOrders.length}
          </span>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner text="Loading orders..." />
        </div>
      ) : liveOrders.length === 0 ? (
        <div className="p-12 flex flex-col items-center gap-3">
          <div className="text-5xl">📭</div>
          <p className="text-gray-400 font-medium">No active orders</p>
          <p className="text-gray-300 text-sm">Orders will appear here once placed</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full min-w-[640px] lg:min-w-0 text-sm border-collapse">

              {/* Table Header */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                  <th className="px-3 py-3 text-left">{isRestaurant ? "Table" : "Room"}</th>
                  {!isRestaurant && (
                    <th className="px-3 py-3 text-left hidden md:table-cell">Guest</th>
                  )}
                  <th className="px-3 py-3 text-left">Item</th>
                  <th className="px-3 py-3 text-center w-[50px]">Qty</th>
                  <th className="px-3 py-3 text-right hidden sm:table-cell">Price</th>
                  <th className="px-3 py-3 text-right hidden sm:table-cell">Total</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100">
                {paginate(liveOrders, livePage).map((o, idx) => (
                  <tr
                    key={o.id}
                    className={`transition-colors duration-150 ${
                      idx % 2 !== 0 ? "bg-gray-50/30" : "bg-white"
                    } hover:bg-indigo-50/50`}
                  >
                    {/* Table / Room */}
                    <td className="px-3 py-3">
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
                        #{isRestaurant ? o.table_number : o.room_number}
                      </span>
                    </td>

                    {/* Guest (hotel only) */}
                    {!isRestaurant && (
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {o.customer_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-semibold text-gray-700 capitalize">{o.customer_name}</span>
                            <span className="text-[9px] text-gray-400 font-mono">#{o.booking_id}</span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Item */}
                    <td className="px-3 py-3">
                      <span className="text-[13px] font-medium text-gray-800">{o.item_name}</span>
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-3 text-center">
                      <span className="text-[12px] font-bold text-gray-700">{o.quantity}</span>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      <span className="text-[12px] text-gray-500">₹{o.price}</span>
                    </td>

                    {/* Total */}
                    <td className="px-3 py-3 text-right hidden sm:table-cell">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[13px] font-bold text-gray-900">₹{o.quantity * o.price}</span>
                        <span className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">total</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <StatusSelect
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              Showing{" "}
              <span className="text-gray-600 font-semibold">
                {paginate(liveOrders, livePage).length}
              </span>{" "}
              of{" "}
              <span className="text-gray-600 font-semibold">{liveOrders.length}</span> orders
            </span>

            {totalLivePages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={livePage === 1}
                  onClick={() => setLivePage(livePage - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {livePage} / {totalLivePages}
                </span>
                <button
                  disabled={livePage === totalLivePages}
                  onClick={() => setLivePage(livePage + 1)}
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
  );
}