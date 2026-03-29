import { useState, useRef, useEffect } from "react";

const ExpenseTable = ({ expenses, loading, onDelete }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded-full w-1/4" />
              <div className="h-3 bg-gray-100 rounded-full w-1/6" />
              <div className="h-3 bg-gray-100 rounded-full w-1/5" />
              <div className="h-3 bg-gray-100 rounded-full w-1/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">📭</div>
          <p className="text-gray-400 font-medium">No expenses found</p>
          <p className="text-gray-300 text-sm">Expenses will appear here once created</p>
        </div>
      </div>
    );
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto lg:overflow-x-visible">
        <table className="w-full min-w-[580px] lg:min-w-0 text-sm border-collapse">

          {/* Header */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
              <th className="px-3 py-3 text-left">Title</th>
              <th className="px-3 py-3 text-left hidden sm:table-cell">Category</th>
              <th className="px-3 py-3 text-left">Date</th>
              <th className="px-3 py-3 text-left">Amount</th>
              <th className="px-3 py-3 text-center w-[70px]">Action</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {expenses.map((e, idx) => (
              <tr
                key={e.id}
                onMouseEnter={() => setHoveredRow(e.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`transition-colors duration-150 ${
                  hoveredRow === e.id
                    ? "bg-indigo-50/50"
                    : idx % 2 !== 0
                    ? "bg-gray-50/30"
                    : "bg-white"
                }`}
              >
                {/* Title */}
                <td className="px-3 py-3">
                  <span className="text-[13px] font-semibold text-gray-800 capitalize">
                    {e.title}
                  </span>
                </td>

                {/* Category */}
                <td className="px-3 py-3 hidden sm:table-cell">
                  {e.category ? (
                    <span className="inline-flex items-center text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full capitalize tracking-wide">
                      {e.category}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">
                      {e.expense_date}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
                      Expense date
                    </span>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-gray-900 whitespace-nowrap">
                      ₹{Number(e.amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[9px] text-red-500 font-semibold uppercase tracking-wide">
                      spent
                    </span>
                  </div>
                </td>

                {/* Action */}
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleDelete(e.id)}
                      title="Delete expense"
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
          Showing{" "}
          <span className="text-gray-600 font-semibold">{expenses.length}</span>{" "}
          {expenses.length === 1 ? "expense" : "expenses"}
        </span>
        <span className="text-xs font-bold text-red-500">
          Total: ₹{expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

export default ExpenseTable;