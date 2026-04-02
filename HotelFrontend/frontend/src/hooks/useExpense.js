import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../config";

const useExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist active filter
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
      setError(err.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  /* ================= POST ================= */
const addExpense = async (data) => {
  try {
    setLoading(true);

    console.log("DATA RECEIVED:", data); // 🔍 DEBUG

    let formattedDate = "";

    if (data.date) {
      // Case 1: DD-MM-YYYY
      if (data.date.includes("-")) {
        const [day, month, year] = data.date.split("-");
        formattedDate = `${year}-${month}-${day}`;
      } else {
        // Case 2: already valid
        formattedDate = data.date;
      }
    } else if (data.expense_date) {
      // Case 3: already correct field
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

    const res = await axios.post(
      `${API_BASE_URL}/api/expenses`,
      payload
    );

    setExpenses((prev) => [
      {
        id: res.data.id,
        ...payload,
      },
      ...prev,
    ]);

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

    // 🔥 Update UI instantly (no refetch)
    setExpenses((prev) => prev.filter((e) => e.id !== id));
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
