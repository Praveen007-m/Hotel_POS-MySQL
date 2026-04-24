import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config";

const useExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeFilterRef = useRef("all");

  /* ================= GET ================= */
  const getExpenses = async (filter = activeFilterRef.current) => {
    try {
      activeFilterRef.current = filter;
      setLoading(true);

      const url =
        filter === "all"
          ? `${API_BASE_URL}/api/expenses`
          : `${API_BASE_URL}/api/expenses?filter=${filter}`;

      const res = await axios.get(url);
      setExpenses(res.data);
      setError(null);
    } catch (err) {
      setExpenses([]);
      setError(err.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  /* ================= POST ================= */
  const addExpense = async (data) => {
    try {
      setLoading(true);

      let formattedDate = "";

      if (data.date) {
        if (data.date.includes("-")) {
          const [day, month, year] = data.date.split("-");
          formattedDate = `${year}-${month}-${day}`;
        } else {
          formattedDate = data.date;
        }
      } else if (data.expense_date) {
        formattedDate = data.expense_date;
      } else {
        throw new Error("Date is missing");
      }

      const payload = {
        title: data.title,
        amount: Number(data.amount),
        category: data.category,
        expense_date: formattedDate,
      };

      await axios.post(`${API_BASE_URL}/api/expenses`, payload);
      await getExpenses(activeFilterRef.current);
    } catch (err) {
      console.error("ADD EXPENSE ERROR:", err);
      setError(err.message || "Failed to add expense");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= PATCH ================= */
  const updateExpense = async (id, data) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE_URL}/api/expenses/${id}`, data);

      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      );
    } catch (err) {
      setError(err.message || "Failed to update expense");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteExpense = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/expenses/${id}`);
      await getExpenses(activeFilterRef.current);
    } catch (err) {
      setError(err.message || "Failed to delete expense");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTO LOAD ================= */
  useEffect(() => {
    getExpenses("all");
  }, []);

  return {
    expenses,
    loading,
    error,
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  };
};

export default useExpense;
