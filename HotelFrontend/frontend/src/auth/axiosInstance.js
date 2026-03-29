import axios from "axios";

const auth = axios.create({
  baseURL: "http://localhost:5000/api",
  // ❌ DO NOT use withCredentials when using JWT headers
});

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
