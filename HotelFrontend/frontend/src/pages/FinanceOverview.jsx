import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import StatCard from "../components/finance/StatCard";
import useExpense from "../hooks/useExpense";
import useProfit from "../hooks/useProfit";
import Container from "../components/layout/Container";

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const FinanceOverview = () => {
  const { expenses, getExpenses } = useExpense();
  const { profit, loading: profitLoading, getProfit } = useProfit();
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    getExpenses(activeFilter);
    getProfit(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const netBalance = profit - totalExpenses;
  const isPositive = netBalance >= 0;

  return (
    <Container>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Finance Overview
          </h1>
          <p className="mt-2 text-gray-500">
            A clear snapshot of your hotel's financial health
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "today", "week", "month"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                activeFilter === filter
                  ? "bg-[#09172A] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 shadow-md">
            <StatCard
              label="Total Income"
              value={profitLoading ? "Loading..." : formatCurrency(profit)}
              color="green"
              icon={
                <div className="rounded-xl bg-green-100 p-3">
                  <ArrowUpRight className="h-7 w-7 text-green-600" />
                </div>
              }
            />
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-red-50 to-white p-6 shadow-md">
            <StatCard
              label="Total Expenses"
              value={formatCurrency(totalExpenses)}
              color="red"
              icon={
                <div className="rounded-xl bg-red-100 p-3">
                  <ArrowDownRight className="h-7 w-7 text-red-600" />
                </div>
              }
            />
          </div>

          <div
            className={`rounded-2xl p-6 shadow-md ${
              isPositive
                ? "bg-gradient-to-br from-blue-50 to-white"
                : "bg-gradient-to-br from-orange-50 to-white"
            }`}
          >
            <StatCard
              label="Total Profit"
              value={formatCurrency(netBalance)}
              color={isPositive ? "blue" : "yellow"}
              icon={
                <div
                  className={`rounded-xl p-3 ${
                    isPositive ? "bg-blue-100" : "bg-orange-100"
                  }`}
                >
                  <Wallet
                    className={`h-7 w-7 ${
                      isPositive ? "text-blue-600" : "text-orange-600"
                    }`}
                  />
                </div>
              }
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          Showing data for:{" "}
          <span className="font-medium">{activeFilter.toUpperCase()}</span>
        </div>
      </div>
    </Container>
  );
};

export default FinanceOverview;
