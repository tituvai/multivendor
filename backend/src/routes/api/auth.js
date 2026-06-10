const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  resendVerification,
  createAdmin,
  getAllAdmins,
} = require("../../controllers/user.controller");

const { protect, authorize } = require("../../middlewares/auth.middleware");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../../middlewares/validation.middleware");

// ─── Rate Limiters ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: "Too many reset attempts. Please try again after an hour.",
  },
});

// ─── Routes ───────────────────────────────────────────────────

// Public Routes
router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordValidation, forgotPassword);
router.put("/reset-password/:token", resetPasswordValidation, resetPassword);
router.post("/refresh-token", refreshToken);

// Private Routes
router.post("/logout",  protect, logout);
router.get("/me", protect, getMe);

// Admin Part Start 

router.post("/create-admin", protect, authorize("admin"), createAdmin);
router.get("/admins",        protect, authorize("admin"), getAllAdmins);

module.exports = router;