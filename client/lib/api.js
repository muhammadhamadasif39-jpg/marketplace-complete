// Central place for all API calls to the backend.
// Import this in any Next.js page/component: import { api } from "@/lib/api";

const API_URL =  "https://marketplace-production-aa0f.up.railway.app/api";

async function request(endpoint, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = res.status; // lets callers distinguish 404 vs 401 vs 500 etc.
    throw error;
  }

  return data;
}

// Separate from request() because file uploads use multipart/form-data,
// not JSON - the browser sets the correct Content-Type boundary automatically
// as long as we don't set Content-Type ourselves.
async function uploadRequest(endpoint, formData, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", headers, body: formData });
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "Upload failed");
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  getMe: (token) => request("/auth/me", { token }),
  updateProfile: (payload, token) => request("/auth/profile", { method: "PUT", body: payload, token }),
  changePassword: (payload, token) => request("/auth/change-password", { method: "PUT", body: payload, token }),
  logout: (token) => request("/auth/logout", { method: "POST", token }),
  refreshAccessToken: (refreshToken) =>
    request("/auth/refresh", { method: "POST", body: { refreshToken } }),
  verifyEmail: (token) => request(`/auth/verify-email?token=${token}`),
  resendVerification: (token) => request("/auth/resend-verification", { method: "POST", token }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, password) =>
    request("/auth/reset-password", { method: "POST", body: { token, password } }),
  sendOtp: (phone, token) => request("/auth/send-otp", { method: "POST", body: { phone }, token }),
  verifyOtp: (otp, token) => request("/auth/verify-otp", { method: "POST", body: { otp }, token }),

  // Products
  getProducts: (queryString = "") => request(`/products${queryString}`),
  getProduct: (slug) => request(`/products/${slug}`),
  getProductById: (id, token) => request(`/products/id/${id}`, { token }),
  getMyProducts: (token) => request("/products/seller/mine", { token }),
  addReview: (productId, payload, token) =>
    request(`/products/${productId}/reviews`, { method: "POST", body: payload, token }),
  updateReview: (productId, payload, token) =>
    request(`/products/${productId}/reviews`, { method: "PUT", body: payload, token }),
  deleteReview: (productId, token) =>
    request(`/products/${productId}/reviews`, { method: "DELETE", token }),
  createProduct: (payload, token) => request("/products", { method: "POST", body: payload, token }),
  updateProduct: (id, payload, token) => request(`/products/${id}`, { method: "PUT", body: payload, token }),
  deleteProduct: (id, token) => request(`/products/${id}`, { method: "DELETE", token }),

  // Sellers
  registerStore: (payload, token) => request("/sellers/register", { method: "POST", body: payload, token }),
  getMyStore: (token) => request("/sellers/me", { token }),
  updateMyStore: (payload, token) => request("/sellers/me", { method: "PUT", body: payload, token }),
  getStore: (slug) => request(`/sellers/${slug}`),

  // Image upload
  uploadImages: (files, token) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return uploadRequest("/upload", formData, token);
  },

  // Categories
  getCategories: () => request("/categories"),
  createCategory: (payload, token) => request("/categories", { method: "POST", body: payload, token }),

  // Cart
  getCart: (token) => request("/cart", { token }),
  addToCart: (payload, token) => request("/cart", { method: "POST", body: payload, token }),
  updateCartItem: (productId, quantity, token) =>
    request(`/cart/${productId}`, { method: "PUT", body: { quantity }, token }),
  removeFromCart: (productId, token) => request(`/cart/${productId}`, { method: "DELETE", token }),
  clearCart: (token) => request("/cart", { method: "DELETE", token }),

  // Wishlist
  getWishlist: (token) => request("/wishlist", { token }),
  addToWishlist: (productId, token) => request(`/wishlist/${productId}`, { method: "POST", token }),
  removeFromWishlist: (productId, token) => request(`/wishlist/${productId}`, { method: "DELETE", token }),

  // Orders
  createOrder: (payload, token) => request("/orders", { method: "POST", body: payload, token }),
  getMyOrders: (token) => request("/orders/my", { token }),
  getOrder: (id, token) => request(`/orders/${id}`, { token }),
  getSellerOrders: (token) => request("/orders/seller/mine", { token }),
  updateOrderStatus: (id, payload, token) =>
    request(`/orders/${id}/status`, { method: "PUT", body: payload, token }),

  // Payments
  initiateJazzCash: (orderId, token) =>
    request("/payments/jazzcash/initiate", { method: "POST", body: { orderId }, token }),
  initiateEasypaisa: (orderId, token) =>
    request("/payments/easypaisa/initiate", { method: "POST", body: { orderId }, token }),
  createStripeSession: (orderId, token) =>
    request("/payments/stripe/create-session", { method: "POST", body: { orderId }, token }),

  // Admin
  getAdminStats: (token) => request("/admin/stats", { token }),
  getAllUsers: (token) => request("/admin/users", { token }),
  updateUserStatus: (id, isActive, token) =>
    request(`/admin/users/${id}/status`, { method: "PUT", body: { isActive }, token }),
  getAllSellersAdmin: (token) => request("/admin/sellers", { token }),
  updateSellerVerification: (id, verificationStatus, token) =>
    request(`/admin/sellers/${id}/verification`, { method: "PUT", body: { verificationStatus }, token }),
  updateSellerCommission: (id, commissionRate, token) =>
    request(`/admin/sellers/${id}/commission`, { method: "PUT", body: { commissionRate }, token }),
  getAllProductsAdmin: (status, token) =>
    request(`/admin/products${status ? `?status=${status}` : ""}`, { token }),
  updateProductApproval: (id, isApproved, token) =>
    request(`/admin/products/${id}/approval`, { method: "PUT", body: { isApproved }, token }),

  // Coupons
  getCoupons: (token) => request("/coupons", { token }),
  createCoupon: (payload, token) => request("/coupons", { method: "POST", body: payload, token }),
  updateCoupon: (id, payload, token) => request(`/coupons/${id}`, { method: "PUT", body: payload, token }),
  deleteCoupon: (id, token) => request(`/coupons/${id}`, { method: "DELETE", token }),
  validateCoupon: (code, orderTotal, token) =>
    request("/coupons/validate", { method: "POST", body: { code, orderTotal }, token }),

  // Banners
  getBanners: () => request("/banners"),
  getAllBanners: (token) => request("/banners/all", { token }),
  createBanner: (payload, token) => request("/banners", { method: "POST", body: payload, token }),
  updateBanner: (id, payload, token) => request(`/banners/${id}`, { method: "PUT", body: payload, token }),
  deleteBanner: (id, token) => request(`/banners/${id}`, { method: "DELETE", token }),
};
