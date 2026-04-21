import { useState } from "react";
import auth from "../auth/axiosInstance";
import { useAuth } from "./useAuth";

export const useLogin = () => {
  const { setUser } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password, options = {}) => {
    const {
      endpoint = "/auth/login",
      requiredRole = null,
      roleError = "This account cannot sign in here",
    } = options;

    setError(null);
    setLoading(true);

    try {
      const res = await auth.post(endpoint, {
        email: String(email || "").trim().toLowerCase(),
        password,
      });

      if (requiredRole && res.data.user?.role !== requiredRole) {
        localStorage.removeItem("token");
        setUser(null);
        setError(roleError);
        return null;
      }

      // Save token
      localStorage.setItem("token", res.data.token);

      // Save user in auth context
      setUser(res.data.user);

      // 🔥 RETURN FULL DATA (IMPORTANT)
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid email or password";

      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, error, loading };
};
