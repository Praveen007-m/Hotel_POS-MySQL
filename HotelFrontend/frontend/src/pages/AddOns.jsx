import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../config";
import Container from "../components/layout/Container";
import { toast } from "react-toastify";

const rowsPerPage = 10;

export default function AddOns() {
  const [addons, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Fetch ── */
  const fetchAddOns = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/addons`);
      setAddOns(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch add-ons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddOns(); }, []);

  /* ── Create ── */
  const createAddOn = async () => {
    if (!newName.trim() || newPrice === "") return toast.warning("Enter name and price");
    try {
      await axios.post(`${API_BASE_URL}/api/addons`, {
        name: newName.trim(),
        price: Number(newPrice),
      });
      setNewName("");
      setNewPrice("");
      fetchAddOns();
      toast.success("Add-on created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create add-on");
    }
  };

  /* ── Delete ── */
  const deleteAddOn = async (id) => {
    if (!window.confirm("Delete this add-on?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/addons/${id}`);
      fetchAddOns();
      toast.success("Add-on deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete add-on");
    }
  };

  /* ── Pagination ── */
  const indexOfFirst = (currentPage - 1) * rowsPerPage;
  const currentRows = addons.slice(indexOfFirst, indexOfFirst + rowsPerPage);
  const totalPages = Math.ceil(addons.length / rowsPerPage);

  return (
    <Container>
      <div className="space-y-5">

        {/* ── Header card ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Manage Add-Ons</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {addons.length} {addons.length === 1 ? "add-on" : "add-ons"} total
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Add-on name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAddOn()}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all bg-gray-50 placeholder-gray-400 min-w-0"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAddOn()}
              className="w-full sm:w-36 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all bg-gray-50 placeholder-gray-400"
            />
            <button
              onClick={createAddOn}
              className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              + Add Add-On
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/5" />
                </div>
              ))}
            </div>
          </div>
        ) : currentRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="text-5xl">📭</div>
              <p className="text-gray-400 font-medium">No add-ons found</p>
              <p className="text-gray-300 text-sm">Create your first add-on above</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full min-w-[400px] lg:min-w-0 text-sm border-collapse">

                {/* Header */}
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                    <th className="px-3 py-3 text-left">Name</th>
                    <th className="px-3 py-3 text-left">Price</th>
                    <th className="px-3 py-3 text-center w-[70px]">Actions</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-gray-100">
                  {currentRows.map((a, idx) => (
                    <tr
                      key={a.id}
                      onMouseEnter={() => setHoveredRow(a.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`transition-colors duration-150 ${
                        hoveredRow === a.id
                          ? "bg-indigo-50/50"
                          : idx % 2 !== 0
                          ? "bg-gray-50/30"
                          : "bg-white"
                      }`}
                    >
                      {/* Name */}
                      <td className="px-3 py-3">
                        <span className="text-[13px] font-semibold text-gray-800 capitalize">
                          {a.name}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-bold text-gray-900">
                            ₹{Number(a.price).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">
                            per unit
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex justify-center">
                          <button
                            onClick={() => deleteAddOn(a.id)}
                            title="Delete add-on"
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
                <span className="text-gray-600 font-semibold">{currentRows.length}</span> of{" "}
                <span className="text-gray-600 font-semibold">{addons.length}</span> add-ons
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}