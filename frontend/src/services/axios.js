import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach access token ──────────────────────────────
API.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// ── Response: auto refresh on 401 ────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          return API(original);
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        Cookies.set("accessToken", newToken, { expires: 1 / 96 }); // 15 min
        processQueue(null, newToken);
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return API(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        Cookies.remove("accessToken");
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;