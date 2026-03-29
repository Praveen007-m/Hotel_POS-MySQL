import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const useProfit = () => {
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProfit = async (filter = "all") => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/billings/profit`,
        {
          params: { filter },
        }
      );

      // ✅ Safe extraction
      const value = Number(res.data?.profit ?? 0);
      setProfit(value);
    } catch (err) {
      console.error("Profit fetch error:", err);
      setError("Failed to fetch profit");
      setProfit(0);
    } finally {
      setLoading(false);
    }
  };

  return {
    profit,
    loading,
    error,
    getProfit,
  };
};

export default useProfit;
