const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");
const multer   = require("multer");

const {
  applyAsVendor,
  getVendorProfile,
  updateVendorProfile,
  getPublicVendorShop,
  getVendorApplications,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  getVendorStats,
} = require("../../controllers/vendor.controller");

const { protect, authorize } = require("../../middlewares/auth.middleware");
const { handleMulterError }  = require("../../middlewares/image.middleware");

// ─── Multer: vendor docs upload (NID + Trade License) ─────────
const storage = multer.memoryStorage();
const uploadDocs = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP allowed"), false);
    }
    cb(null, true);
  },
}).fields([
  { name: "nidImage",     maxCount: 1 },
  { name: "tradeLicense", maxCount: 1 },
]);

// ─── Validation helper ─────────────────────────────────────────
const validate = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().reduce((acc, e) => {
      acc[e.path] = e.msg;
      return acc;
    }, {});
    return res.status(422).json({ success: false, message: "Validation failed", errors: formatted });
  }
  next();
};

const applyValidation = [
  body("shopName")
    .trim().notEmpty().withMessage("Shop name is required")
    .isLength({ min: 3, max: 60 }).withMessage("Shop name must be 3–60 characters"),
  body("shopDescription")
    .optional().trim()
    .isLength({ max: 500 }).withMessage("Description max 500 characters"),
  body("shopPhone")
    .optional().trim()
    .isMobilePhone().withMessage("Invalid phone number"),
  body("shopEmail")
    .optional().trim()
    .isEmail().withMessage("Invalid email address"),
  body("nidNumber")
    .optional().trim()
    .isLength({ min: 10, max: 20 }).withMessage("Invalid NID number"),
  validate,
];

const rejectValidation = [
  body("reason").trim().notEmpty().withMessage("Rejection reason is required")
    .isLength({ min: 10 }).withMessage("Please provide a detailed reason (min 10 characters)"),
  validate,
];

const suspendValidation = [
  body("reason").trim().notEmpty().withMessage("Suspend reason is required")
    .isLength({ min: 10 }).withMessage("Please provide a detailed reason (min 10 characters)"),
  validate,
];

// ══════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════════════

// GET /api/vendors/:vendorId/shop  → public shop page
router.get("/:vendorId/shop", getPublicVendorShop);

// ══════════════════════════════════════════════════════════════
// CUSTOMER ROUTES (apply to become vendor)
// ══════════════════════════════════════════════════════════════

// POST /api/vendors/apply  → customer applies as vendor
// multipart/form-data: shopName, shopDescription, nidImage, tradeLicense etc.
router.post(
  "/apply",
  protect,
  // handleMulterError(uploadDocs),
  applyValidation,
  applyAsVendor
);

// ══════════════════════════════════════════════════════════════
// VENDOR ROUTES (their own profile)
// ══════════════════════════════════════════════════════════════

// GET /api/vendors/profile       → get own shop info
// PUT /api/vendors/profile       → update own shop info
router.get("/profile", protect, authorize("vendor"), getVendorProfile);
router.put("/profile", protect, authorize("vendor"), updateVendorProfile);

// ══════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════

// GET   /api/vendors/admin/stats                    → dashboard stats
// GET   /api/vendors/admin/applications             → all applications (filter by status)
// GET   /api/vendors/admin/:vendorId                → single vendor detail
// PATCH /api/vendors/admin/:vendorId/approve        → approve
// PATCH /api/vendors/admin/:vendorId/reject         → reject with reason
// PATCH /api/vendors/admin/:vendorId/suspend        → suspend with reason
// PATCH /api/vendors/admin/:vendorId/reactivate     → reactivate suspended vendor

router.get(   "/admin/stats",                  protect, authorize("admin"), getVendorStats);
router.get(   "/admin/applications",           protect, authorize("admin"), getVendorApplications);
router.get(   "/admin/:vendorId",              protect, authorize("admin"), getVendorDetails);
router.patch( "/admin/:vendorId/approve",      protect, authorize("admin"), approveVendor);
router.patch( "/admin/:vendorId/reject",       protect, authorize("admin"), rejectValidation, rejectVendor);
router.patch( "/admin/:vendorId/suspend",      protect, authorize("admin"), suspendValidation, suspendVendor);
router.patch( "/admin/:vendorId/reactivate",   protect, authorize("admin"), reactivateVendor);

module.exports = router;