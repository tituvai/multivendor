import API from "@/services/axios";

export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  logout: () => API.post("/auth/logout"),
  getMe: () => API.get("/auth/me"),
  verifyEmail: (token) => API.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => API.post("/auth/resend-verification", { email }),
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password }),
};
