const PRODUCTION_API = "https://multivendor-ybbe.onrender.com/api/v1";
const DEVELOPMENT_API = "http://localhost:5000/api/v1";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_API : DEVELOPMENT_API);
