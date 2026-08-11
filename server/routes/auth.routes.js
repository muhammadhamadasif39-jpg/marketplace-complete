const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const authLimiter = require("../middleware/authLimiter.middleware");

// Public
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/verify-email", verifyEmail);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Private
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/resend-verification", protect, resendVerification);
router.post("/logout", protect, logoutUser);
router.post("/send-otp", protect, authLimiter, sendOtp);
router.post("/verify-otp", protect, authLimiter, verifyOtp);

module.exports = router;
