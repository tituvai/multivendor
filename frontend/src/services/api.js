import API from "./axios";

export const orderAPI = {
  getAll: () => API.get("/orders"),
  getOne: (id) => API.get(`/orders/${id}`),
  getVendorOrders: (params) => API.get("/orders/vendor/my-orders", { params }),
  updateItemStatus: (orderId, itemId, data) =>
    API.patch(`/orders/${orderId}/items/${itemId}/status`, data),
  adminGetAll: (params) => API.get("/orders/admin/all", { params }),
  adminStats: (params) => API.get("/orders/admin/stats", { params }),
  adminUpdateStatus: (id, data) => API.patch(`/orders/admin/${id}/status`, data),
};

export const productAPI = {
  getAll: (params) => API.get("/products", { params }),
  getMyProducts: (params) => API.get("/products/vendor/my-products", { params }),
  create: (data) => API.post("/products/add", data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  adminGetAll: (params) => API.get("/products/admin/all", { params }),
  adminStats: () => API.get("/products/admin/stats"),
  approve: (id) => API.patch(`/products/${id}/approve`),
  reject: (id, data) => API.patch(`/products/${id}/reject`, data),
  toggleFeatured: (id) => API.patch(`/products/${id}/featured`),
};

export const categoryAPI = {
  getAll: (params) => API.get("/categories", { params }),
  getTree: () => API.get("/categories/tree"),
  getFeatured: () => API.get("/categories/featured"),
  getOne: (idOrSlug) => API.get(`/categories/${idOrSlug}`),
  create: (data) => API.post("/categories", data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  toggle: (id) => API.patch(`/categories/${id}/toggle`),
  delete: (id, params) => API.delete(`/categories/${id}`, { params }),
};

export const flashSaleAPI = {
  getActive: () => API.get("/flash-sales/active"),
  adminGetAll: (params) => API.get("/flash-sales/admin/all", { params }),
  adminGetById: (id) => API.get(`/flash-sales/${id}`),
  create: (data) => API.post("/flash-sales", data),
  update: (id, data) => API.put(`/flash-sales/${id}`, data),
  delete: (id) => API.delete(`/flash-sales/${id}`),
  updateSoldCount: (flashSaleId, itemId, quantity) => API.patch(`/flash-sales/${flashSaleId}/items/${itemId}`, { quantity }),
};

export const bannerAPI = {
  getActive: (params) => API.get("/banners", { params }),
  adminGetAll: (params) => API.get("/banners/admin/all", { params }),
  adminGetById: (id) => API.get(`/banners/${id}`),
  create: (data) => API.post("/banners", data),
  update: (id, data) => API.put(`/banners/${id}`, data),
  delete: (id) => API.delete(`/banners/${id}`),
  toggleStatus: (id) => API.patch(`/banners/${id}/toggle`),
};

export const vendorAPI = {
  apply: (data) => API.post("/vendors/apply", data),
  getProfile: () => API.get("/vendors/profile"),
  updateProfile: (data) => API.put("/vendors/profile", data),
  adminGetAll: (params) => API.get("/vendors/admin/applications", { params }),
  adminGetOne: (id) => API.get(`/vendors/admin/${id}`),
  adminStats: () => API.get("/vendors/admin/stats"),
  approve: (id, data) => API.patch(`/vendors/admin/${id}/approve`, data),
  reject: (id, data) => API.patch(`/vendors/admin/${id}/reject`, data),
  suspend: (id, data) => API.patch(`/vendors/admin/${id}/suspend`, data),
  reactivate: (id) => API.patch(`/vendors/admin/${id}/reactivate`),
};

export const uploadAPI = {
  avatar: (formData) => API.post("/upload/avatar", formData),
  shopBanner: (formData) => API.post("/upload/banner", formData),
};

export default API;
