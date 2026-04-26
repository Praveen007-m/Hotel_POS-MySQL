import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";

import BillingModal from "./BillingModal";
import Pagination from "./Pagination";
import SearchInput from "../common/SearchInput";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Download, MoreVertical, Eye } from "lucide-react";

const PAGE_SIZE = 8;

// ─── BILLED BY CELL ──────────────────────────────────────────────────────────
function BilledByCell({ billedBy }) {
  const name = billedBy && billedBy.trim() !== "" ? billedBy : "Admin User";
  const initial = name[0].toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600 uppercase">
        {initial}
      </span>
      <span className="text-sm text-gray-700 whitespace-nowrap">{name}</span>
    </div>
  );
}

// ─── TABLE ROW ───────────────────────────────────────────────────────────────
function BillRow({ bill, onOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const customerInitial = (bill.customer_name || "?")[0].toUpperCase();
  const formattedDate = bill.created_at
    ? new Date(bill.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
      {/* Bill ID */}
      <td className="py-3 pl-4 pr-3 text-sm font-medium text-gray-700 whitespace-nowrap">
        #{bill.id}
      </td>

      {/* Booking ID */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
          {bill.booking_id}
        </span>
      </td>

      {/* Customer */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white uppercase">
            {customerInitial}
          </span>
          <span className="text-sm font-medium text-gray-800">
            {bill.customer_name || "—"}
          </span>
        </div>
      </td>

      {/* Room */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-500">
            ⌂
          </span>
          <span className="text-sm text-gray-700">
            {bill.room_number ? bill.room_number : "—"}
          </span>
        </div>
      </td>

      {/* Date */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-700">{formattedDate}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Created
        </div>
      </td>

      {/* Advance */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-800">
          ₹{Number(bill.advance_paid || 0).toLocaleString("en-IN")}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-green-600">
          Paid
        </div>
      </td>

      {/* Billed By */}
      <td className="px-3 py-3 whitespace-nowrap">
        <BilledByCell billedBy={bill.billed_by} />
      </td>

      {/* Total */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="text-sm font-bold text-gray-900">
          ₹{Number(bill.total_amount || 0).toLocaleString("en-IN")}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Total
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 pl-3 pr-4 whitespace-nowrap">
        <div className="relative flex justify-end">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(bill);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50"
              >
                <Eye size={14} /> Generate Bill
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── BILLING LIST ─────────────────────────────────────────────────────────────
const BillingList = () => {
  const [billings, setBillings] = useState([]);
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [form, setForm] = useState({
    room_price: 0,
    add_ons: [],
    kitchen_orders: [],
    discount: 0,
  });

  const removeBillFromUi = (billId) => {
    setBillings((prev) => prev.filter((b) => b.id !== billId));
    setFilteredBillings((prev) => prev.filter((b) => b.id !== billId));
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billings`);
      const billsArray = res.data?.billings || res.data || [];
      if (!Array.isArray(billsArray)) {
        toast.error("Invalid response format");
        setBillings([]);
        setFilteredBillings([]);
        return;
      }
      setBillings(billsArray);
      setFilteredBillings(billsArray);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddOns = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/addons`);
      setAvailableAddOns(res.data || []);
    } catch (err) {
      console.error("Failed to fetch add-ons", err);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchAddOns();
  }, []);

  useEffect(() => {
    setSearchLoading(true);
    const timer = setTimeout(() => {
      if (!search.trim()) {
        setFilteredBillings(billings);
      } else {
        const text = search.toLowerCase();
        setFilteredBillings(
          billings.filter(
            (b) =>
              b.booking_id?.toLowerCase().includes(text) ||
              b.customer_name?.toLowerCase().includes(text)
          )
        );
      }
      setCurrentPage(1);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, billings]);

  const parseBillAddOns = (addOns) => {
    if (!Array.isArray(addOns)) return [];
    return addOns.map((a) => ({
      name: a.name,
      qty: Number(a.qty) || 1,
      price: Number(a.price) || 0,
    }));
  };

  const openModal = async (bill) => {
    if (!bill?.id) {
      toast.error("Invalid bill");
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billings/${bill.id}`);
      setSelectedBill(res.data);
      const roomCharges = (res.data.lines?.room ?? []).reduce(
        (sum, item) => sum + Number(item?.total || 0),
        0
      );
      setForm({
        room_price: roomCharges,
        add_ons: parseBillAddOns(res.data.add_ons),
        kitchen_orders: res.data.kitchen_orders || [],
        discount: Number(res.data.discount || 0),
      });
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bill details");
    }
  };

  const handleModalDeleteComplete = (billId) => {
    removeBillFromUi(billId);
    setSelectedBill(null);
    setModalOpen(false);
  };

  const handleExportCSV = async () => {
    try {
      if (
        exportStartDate &&
        exportEndDate &&
        new Date(exportStartDate) > new Date(exportEndDate)
      ) {
        toast.error("Start date cannot be after end date");
        return;
      }
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (exportStartDate) params.set("startDate", exportStartDate);
      if (exportEndDate) params.set("endDate", exportEndDate);

      const exportUrl = params.toString()
        ? `${API_BASE_URL}/api/billings/export/csv?${params.toString()}`
        : `${API_BASE_URL}/api/billings/export/csv`;

      const response = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "billing-statements.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  const totalPages = Math.ceil(filteredBillings.length / PAGE_SIZE);
  const paginatedBills = filteredBillings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Billing</h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:flex-none sm:w-auto"
            />
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:flex-none sm:w-auto"
            />
            <button
              onClick={handleExportCSV}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#020617] active:scale-95"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search bookings or customers..."
            className="w-full sm:w-64 md:w-80"
          />
        </div>
      </div>

      {/* ── Content ── */}
      {loading || searchLoading ? (
        <LoadingSpinner />
      ) : paginatedBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-400 text-sm">No billing records found.</p>
        </div>
      ) : (
        <>
          {/* ── Scrollable Table (all screen sizes) ── */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[780px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[
                      "Bill ID",
                      "Booking ID",
                      "Customer",
                      "Room",
                      "Date",
                      "Advance",
                      "Billed By",
                      "Total",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 first:pl-4 last:pr-4 last:text-right whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBills.map((bill) => (
                    <BillRow key={bill.id} bill={bill} onOpen={openModal} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-600">
                {filteredBillings.length}
              </span>{" "}
              records
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* ── Modal ── */}
      <BillingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBill(null);
        }}
        selectedBill={selectedBill}
        form={form}
        setForm={setForm}
        availableAddOns={availableAddOns}
        onDeleteComplete={handleModalDeleteComplete}
      />
    </div>
  );
};

export default BillingList;
