import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import useExpense from "../hooks/useExpense";
import Container from "../components/layout/Container";

import AddExpenseModal from "../components/expenses/AddExpenseModal";
import ExpenseFilters from "../components/expenses/ExpenseFilters";
import ExpenseTable from "../components/expenses/ExpenseTable";
import ExpensePagination from "../components/expenses/ExpensePagination";
import ExpenseTotal from "../components/expenses/ExpenseTotal";

const ITEMS_PER_PAGE = 6;

const Expenses = () => {
  const { expenses, loading, error, addExpense, deleteExpense, getExpenses } =
    useExpense();

  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");

  /* ================= LOAD EXPENSES ================= */
  useEffect(() => {
    getExpenses("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= FILTER + SEARCH ================= */
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start of week (Monday)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    // End of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return expenses.filter((e) => {
      // ---- DATE PARSE ----
      const [y, m, d] = e.expense_date.split("-");
      const expenseDate = new Date(y, m - 1, d);
      expenseDate.setHours(0, 0, 0, 0);

      // ---- DATE FILTER ----
      if (activeFilter === "today" && expenseDate.getTime() !== today.getTime())
        return false;

      if (
        activeFilter === "week" &&
        (expenseDate < startOfWeek || expenseDate > endOfWeek)
      )
        return false;

      if (
        activeFilter === "month" &&
        (expenseDate.getMonth() !== today.getMonth() ||
          expenseDate.getFullYear() !== today.getFullYear())
      )
        return false;

      // ---- SEARCH FILTER ----
      if (!search.trim()) return true;

      const q = search.toLowerCase();

      return (
        e.title?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.expense_date.includes(q)
      );
    });
  }, [expenses, activeFilter, search]);

  /* ================= RESET PAGE ON FILTER/SEARCH ================= */
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, search]);

  /* ================= TOTAL ================= */
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  /* ================= UI ================= */
  return (
    <Container>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
            <p className="text-gray-500 mt-1">
              Track and manage all hotel expenses
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="bg-[#09172A] text-white px-6 py-2 rounded-lg"
          >
            Add Expense
          </button>
        </div>

        {/* ADD EXPENSE MODAL */}
        <AddExpenseModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onAdd={addExpense}
          loading={loading}
          error={error}
        />

        {/* CARD */}
        <div className="bg-white rounded-xl shadow border p-6 space-y-4">
          {/* FILTER + SEARCH + TOTAL */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
              <ExpenseFilters
                activeFilter={activeFilter}
                onChange={setActiveFilter}
              />

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <ExpenseTotal total={totalAmount} />
          </div>

          {/* TABLE */}
          <ExpenseTable
            expenses={paginatedExpenses}
            loading={loading}
            onDelete={deleteExpense}
          />

          {/* PAGINATION */}
          {totalPages > 1 && (
            <ExpensePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </Container>
  );
};

export default Expenses;
