import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { Eye, Trash2, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

import CustomerForm from "./CustomerForm";
import CustomerDetails from "./CustomerDetails";
import SearchInput from "../common/SearchInput";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../hooks/useAuth";

const ITEMS_PER_PAGE = 6;

/* ================= FIXED-POSITION ACTIONS MENU ================= */
const ActionsMenu = ({ customer, onView, onEdit, onDelete, user }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;
    if (top + 130 > window.innerHeight) top = rect.top - 130 - 8;
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

  const MenuItem = ({ icon, label, colorClass, bgClass, hoverBg, hoverText, onClick }) => (
    <button
      onClick={() => { setOpen(false); onClick(); }}
      className={`group flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-700 ${hoverBg} ${hoverText} transition-all duration-200`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgClass} ${colorClass} group-hover:opacity-80 transition-opacity shrink-0`}>
        {icon}
      </span>
      <span className="font-semibold">{label}</span>
    </button>
  );

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        onClick={openMenu}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${open ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 180 }}
          className="menu-appear"
        >
          <div className="rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden border border-gray-100">
            <div className="py-1.5 px-1.5">
              <MenuItem
                icon={<Eye size={13} />}
                label="View Details"
                bgClass="bg-blue-100" colorClass="text-blue-600"
                hoverBg="hover:bg-blue-50" hoverText="hover:text-blue-700"
                onClick={() => onView(customer)}
              />
              {user?.role === "admin" && (
                <>
                  <div className="my-1.5 mx-2 border-t border-gray-100" />
                  <MenuItem
                    icon={<Edit2 size={13} />}
                    label="Edit Customer"
                    bgClass="bg-amber-100" colorClass="text-amber-600"
                    hoverBg="hover:bg-amber-50" hoverText="hover:text-amber-700"
                    onClick={() => onEdit(customer)}
                  />
                  <div className="my-1.5 mx-2 border-t border-gray-100" />
                  <MenuItem
                    icon={<Trash2 size={13} />}
                    label="Delete"
                    bgClass="bg-red-100" colorClass="text-red-500"
                    hoverBg="hover:bg-red-50" hoverText="hover:text-red-700"
                    onClick={() => onDelete(customer.id)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= SKELETON ================= */
const SkeletonRows = () =>
  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
    <tr key={i} className="animate-pulse border-b border-gray-100">
      {Array.from({ length: 5 }).map((__, j) => (
        <td key={j} className="px-3 py-4">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
        </td>
      ))}
    </tr>
  ));

/* ================= MODAL ================= */
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-sm"
      >
        ✕
      </button>
      {children}
    </div>
  </div>
);

/* ================= CUSTOMER LIST ================= */
export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const { user } = useAuth();

  /* ── Fetch ── */
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customers`);
      setCustomers(res.data || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  /* ── Search ── */
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const text = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(text) ||
        c.email?.toLowerCase().includes(text) ||
        c.contact?.toLowerCase().includes(text)
    );
  }, [customers, search]);

  /* ── Pagination ── */
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, page]);

  /* ── Save ── */
  const saveCustomer = async (formData) => {
    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (editCustomer?.id) {
        await axios.put(`${API_BASE_URL}/api/customers/${editCustomer.id}`, formData, config);
      } else {
        await axios.post(`${API_BASE_URL}/api/customers`, formData, config);
      }
      setShowFormModal(false);
      setEditCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save customer");
    }
  };

  /* ── Delete ── */
  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customer");
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setShowFormModal(true);
  };

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

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? "customer" : "customers"} total
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search customers"
              className="w-full sm:w-72"
            />
            <button
              onClick={() => { setEditCustomer(null); setShowFormModal(true); }}
              className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 hover:shadow-md transition-all whitespace-nowrap"
            >
            Add Customer
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="overflow-x-auto lg:overflow-x-visible overflow-y-visible">
            <table className="w-full min-w-[600px] lg:min-w-0 text-sm border-collapse rounded-t-2xl overflow-hidden">

              {/* Header */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                  <th className="px-3 py-3 text-left">Customer</th>
                  <th className="px-3 py-3 text-left">Contact</th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Email</th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">ID Proof</th>
                  <th className="px-3 py-3 text-center w-[60px]">Actions</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <SkeletonRows />
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-5xl">📭</div>
                        <p className="text-gray-400 font-medium">No customers found</p>
                        <p className="text-gray-300 text-sm">Add your first customer to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`transition-colors duration-150 ${idx % 2 !== 0 ? "bg-gray-50/30" : "bg-white"
                        } hover:bg-indigo-50/50`}
                    >
                      {/* Customer */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800 capitalize text-[13px] truncate max-w-[120px]">
                            {c.name}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {c.contact}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className="text-[12px] text-gray-500 truncate block max-w-[180px]">
                          {c.email || (
                            <span className="text-gray-300">—</span>
                          )}
                        </span>
                      </td>

                      {/* ID Proof */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wide whitespace-nowrap">
                            {c.id_type}
                          </span>
                          <span className="text-[11px] font-mono text-gray-500">
                            {c.id_number}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <ActionsMenu
                          customer={c}
                          onView={setViewCustomer}
                          onEdit={handleEdit}
                          onDelete={deleteCustomer}
                          user={user}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-b-2xl">
            <span className="text-xs text-gray-400 font-medium">
              Showing{" "}
              <span className="text-gray-600 font-semibold">{paginatedCustomers.length}</span> of{" "}
              <span className="text-gray-600 font-semibold">{filteredCustomers.length}</span> customers
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
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

      {/* ── View Modal ── */}
      {viewCustomer && (
        <CustomerDetails
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
        />
      )}

      {/* ── Add / Edit Modal ── */}
      {showFormModal && (
        <Modal onClose={() => setShowFormModal(false)}>
          <CustomerForm
            existing={editCustomer}
            onSave={saveCustomer}
            onCancel={() => setShowFormModal(false)}
          />
        </Modal>
      )}
    </>
  );
}