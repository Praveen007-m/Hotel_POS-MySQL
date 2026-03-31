import axios from "axios";
import { API_URL } from "../config";

const auth = axios.create({
  baseURL: API_URL,
});

// Attach token
auth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default auth;
