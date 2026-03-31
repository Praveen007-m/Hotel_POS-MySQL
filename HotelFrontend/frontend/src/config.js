const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const defaultApiUrl = isLocalHost
  ? "http://localhost:5000/api"
  : "https://hotelpos-production.up.railway.app/api";

const rawApiUrl = import.meta.env.VITE_API_URL || defaultApiUrl;

const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
const normalizedApiOrigin = normalizedApiUrl.replace(/\/api$/, "");

export const API_BASE_URL = normalizedApiOrigin;
export const API_URL = `${normalizedApiOrigin}/api`;
