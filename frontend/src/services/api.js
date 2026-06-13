import API from "./axios";

// ════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════
export const authAPI = {
  login:              (data)  => API.post("/auth/login", data),
  register:           (data)  => API.post("/auth/register", data),
  logout:             ()      => API.post("/auth/logout"),
  getMe:              ()      => API.get("/auth/me"),
  forgotPassword:     (data)  => API.post("/auth/forgot-password", data),
  resetPassword:      (token, data) => API.put(`/auth/reset-password/${token}`, data),
  verifyEmail:        (token) => API.get(`/auth/verify-email/${token}`),
  resendVerification: (data)  => API.post("/auth/resend-verification", data),
  refreshToken:       ()      => API.post("/auth/refresh-token"),
  createAdmin:        (data)  => API.post("/auth/create-admin", data),
  getAllAdmins:        ()      => API.get("/auth/admins"),
};

// ════════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════════
export const productAPI = {
  getAll:       (params) => API.get("/products", { params }),
  getOne:       (slug)   => API.get(`/products/${slug}`),
  create:       (data)   => API.post("/products", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update:       (id, data) => API.put(`/products/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  delete:       (id)     => API.delete(`/products/${id}`),
  getMyProducts:(params) => API.get("/products/vendor/my-products", { params }),
  adminGetAll:  (params) => API.get("/products/admin/all", { params }),
  adminStats:   ()       => API.get("/products/admin/stats"),
  approve:      (id)     => API.patch(`/products/${id}/approve`),
  reject:       (id, data) => API.patch(`/products/${id}/reject`, data),
  toggleFeatured:(id)    => API.patch(`/products/${id}/featured`),
  addReview:    (id, data) => API.post(`/products/${id}/reviews`, data),
};

// ════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════
export const categoryAPI = {
  getTree:     ()       => API.get("/categories/tree"),
  getAll:      (params) => API.get("/categories", { params }),
  getFeatured: ()       => API.get("/categories/featured"),
  getOne:      (slug)   => API.get(`/categories/${slug}`),
  create:      (data)   => {
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      return API.post("/categories", data, { headers: { "Content-Type": "multipart/form-data" } });
    }
    return API.post("/categories", data);
  },
  update:      (id, data) => {
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      return API.put(`/categories/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
    }
    return API.put(`/categories/${id}`, data);
  },
  delete:      (id, force) => API.delete(`/categories/${id}`, { params: { force } }),
  toggle:      (id)     => API.patch(`/categories/${id}/toggle`),
  reorder:     (data)   => API.put("/categories/reorder", data),
  stats:       ()       => API.get("/categories/admin/stats"),
  uploadImage: (id, data) => API.post(`/upload/category/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteImage: (id)     => API.delete(`/upload/category/${id}/image`),
};

// ════════════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════════════
export const orderAPI = {
  place:          (data)  => API.post("/orders", data),
  getMyOrders:    (params) => API.get("/orders/my-orders", { params }),
  getOne:         (id)    => API.get(`/orders/${id}`),
  cancel:         (id, data) => API.patch(`/orders/${id}/cancel`, data),
  getVendorOrders:(params) => API.get("/orders/vendor/my-orders", { params }),
  updateItemStatus:(orderId, itemId, data) => API.patch(`/orders/${orderId}/items/${itemId}/status`, data),
  adminGetAll:    (params) => API.get("/orders/admin/all", { params }),
  adminStats:     (params) => API.get("/orders/admin/stats", { params }),
  adminUpdateStatus:(id, data) => API.patch(`/orders/admin/${id}/status`, data),
};

// ════════════════════════════════════════════════════
// VENDORS
// ════════════════════════════════════════════════════
export const vendorAPI = {
  apply:          (data)  => API.post("/vendors/apply", data, { headers: { "Content-Type": "multipart/form-data" } }),
  getProfile:     ()      => API.get("/vendors/profile"),
  updateProfile:  (data)  => API.put("/vendors/profile", data),
  getShop:        (id)    => API.get(`/vendors/${id}/shop`),
  adminGetAll:    (params) => API.get("/vendors/admin/applications", { params }),
  adminGetOne:    (id)    => API.get(`/vendors/admin/${id}`),
  adminStats:     ()      => API.get("/vendors/admin/stats"),
  approve:        (id, data) => API.patch(`/vendors/admin/${id}/approve`, data),
  reject:         (id, data) => API.patch(`/vendors/admin/${id}/reject`, data),
  suspend:        (id, data) => API.patch(`/vendors/admin/${id}/suspend`, data),
  reactivate:     (id)    => API.patch(`/vendors/admin/${id}/reactivate`),
};

// ════════════════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════════════════
export const uploadAPI = {
  avatar:     (data) => API.post("/upload/avatar", data, { headers: { "Content-Type": "multipart/form-data" } }),
  shopBanner: (data) => API.post("/upload/shop-banner", data, { headers: { "Content-Type": "multipart/form-data" } }),
};