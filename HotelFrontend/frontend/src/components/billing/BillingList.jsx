import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { toast } from "react-toastify";

import BillingTable from "./BillingTable";
import BillingModal from "./BillingModal";
import Pagination from "./Pagination";
import SearchInput from "../common/SearchInput";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Download } from "lucide-react";
const PAGE_SIZE = 8;

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

  /* ================= FETCH BILLINGS ================= */
  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billings`);

      const billsArray = res.data?.billings || res.data || [];
      if (!Array.isArray(billsArray)) {
        console.error("Invalid billings data:", billsArray);
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

  /* ================= FETCH ADD-ONS ================= */
  const fetchAddOns = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/addons`);
      setAvailableAddOns(res.data || []);
    } catch (err) {
      console.error("Failed to fetch add-ons", err);
    }
  };

  /* ================= DELETE BILL ================= */
  const handleDeleteBill = async (billId) => {
    if (!billId) {
      toast.error("Invalid bill ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/billings/${billId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove deleted bill from UI
      setBillings((prev) => prev.filter((b) => b.id !== billId));
      setFilteredBillings((prev) => prev.filter((b) => b.id !== billId));
      toast.success("Bill deleted");
    } catch (err) {
      console.error("Failed to delete bill", err);
      toast.error("Failed to delete bill");
    }
  };

  /* ================= MARK BILL AS DOWNLOADED ================= */
  const handleMarkDownloaded = async (billId, gstNumber) => {
    if (!billId) {
      toast.error("Invalid bill ID");
      return;
    }

    // Optimistically hide the row while preserving the DB record.
    removeBillFromUi(billId);
    setModalOpen(false);
    setSelectedBill(null);

    try {
      const token = localStorage.getItem("token");
      const body = {};
      if (gstNumber !== undefined) body.gst_number = gstNumber;
      await axios.patch(`${API_BASE_URL}/api/billings/${billId}/downloaded`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Bill downloaded and hidden from the list");
    } catch (err) {
      // Revert optimistic update on error
      fetchBills();
      console.error("Failed to mark bill as downloaded", err);
      toast.error("Failed to update bill status");
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchBills();
    fetchAddOns();
  }, []);

  /* ================= SEARCH (WITH LOADING) ================= */
  useEffect(() => {
    setSearchLoading(true);

    const timer = setTimeout(() => {
      if (!search.trim()) {
        setFilteredBillings(billings);
      } else {
        const text = search.toLowerCase();

        const result = billings.filter((bill) => {
          return (
            bill.booking_id?.toLowerCase().includes(text) ||
            bill.customer_name?.toLowerCase().includes(text)
          );
        });

        setFilteredBillings(result);
      }

      setCurrentPage(1);
      setSearchLoading(false);
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [search, billings]);

  /* ================= OPEN MODAL ================= */
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

      // FIXED: Use actual backend room lines total (matches BillingModal)
      const roomCharges = (res.data.lines?.room ?? []).reduce(
        (sum, item) => sum + Number(item?.total || 0), 0
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

  /* ================= EXPORT CSV ================= */
  const handleExportCSV = async () => {
    try {
      if (
        exportStartDate &&
        exportEndDate &&
        new Date(exportStartDate) > new Date(exportEndDate)
      ) {
        toast.error("Export start date cannot be after end date");
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export request failed");
      }

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

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredBillings.length / PAGE_SIZE);

  const paginatedBills = filteredBillings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Billing
        </h1>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0F172A] text-white border border-[#1E293B] rounded-lg shadow-md hover:bg-[#020617] hover:border-cyan-400 hover:shadow-cyan-500/20 transition-all duration-200 w-full sm:w-auto"
            >
              <Download size={16} />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search bookings or customers..."
            className="w-full md:w-85"
          />
        </div>
      </div>

      {loading || searchLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <BillingTable
            billings={paginatedBills}
            onOpen={openModal}
            onDelete={handleDeleteBill}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* ================= MODAL ================= */}
      <BillingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        selectedBill={selectedBill}
        form={form}
        setForm={setForm}
        availableAddOns={availableAddOns}
        onDownload={handleMarkDownloaded}
      />
    </div>
  );
};

export default BillingList;
