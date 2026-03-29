import { useEffect, useMemo, useState } from "react";
import Container from "../components/layout/Container";
import useExpense from "../hooks/useExpense";
import useProfit from "../hooks/useProfit";
import StatCard from "../components/finance/StatCard";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

const FinanceOverview = () => {
  const { expenses, getExpenses } = useExpense();
  const { profit, loading: profitLoading, getProfit } = useProfit();

  const [activeFilter, setActiveFilter] = useState("all");

  /* ================= LOAD DATA (FILTER-AWARE) ================= */
  useEffect(() => {
    getExpenses(activeFilter);
    getProfit(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  /* ================= CALCULATIONS ================= */
  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
  }, [expenses]);

  const netBalance = profit - totalExpenses;
  const isPositive = netBalance >= 0;

  /* ================= UI ================= */
  return (
    <Container>
      <div className="space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Finance Overview
          </h1>
          <p className="text-gray-500 mt-2">
            A clear snapshot of your hotel’s financial health
          </p>
        </div>

        {/* 🔥 FILTER BUTTONS (HERE THEY ARE) */}
        <div className="flex flex-wrap gap-2">
          {["all", "today", "week", "month"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition
                ${activeFilter === filter
                  ? "bg-[#09172A] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* PROFIT */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-md p-6">
            <StatCard
              label="Total Income"
              value={profitLoading ? "—" : `₹ ${profit}`}
              color="text-green-700"
              icon={
                <div className="p-3 bg-green-100 rounded-xl">
                  <ArrowUpRight className="w-7 h-7 text-green-600" />
                </div>
              }
            />
          </div>

          {/* EXPENSE */}
          <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-md p-6">
            <StatCard
              label="Total Expenses"
              value={`₹ ${totalExpenses}`}
              color="text-red-700"
              icon={
                <div className="p-3 bg-red-100 rounded-xl">
                  <ArrowDownRight className="w-7 h-7 text-red-600" />
                </div>
              }
            />
          </div>

          {/* NET BALANCE */}
          <div
            className={`rounded-2xl shadow-md p-6
              ${isPositive
                ? "bg-gradient-to-br from-blue-50 to-white"
                : "bg-gradient-to-br from-orange-50 to-white"
              }`}
          >
            <StatCard
              label="Total Profit"
              value={`₹ ${netBalance}`}
              color={isPositive ? "text-blue-700" : "text-orange-700"}
              icon={
                <div
                  className={`p-3 rounded-xl ${isPositive
                      ? "bg-blue-100"
                      : "bg-orange-100"
                    }`}
                >
                  <Wallet
                    className={`w-7 h-7 ${isPositive
                        ? "text-blue-600"
                        : "text-orange-600"
                      }`}
                  />
                </div>
              }
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-sm text-gray-500 text-center">
          Showing data for: <span className="font-medium">{activeFilter.toUpperCase()}</span>
        </div>

      </div>
    </Container>
  );
};

export default FinanceOverview;
