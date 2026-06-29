const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

const {
  createFlashSale,
  getAllFlashSales,
  getActiveFlashSale,
  getFlashSaleById,
  updateFlashSale,
  deleteFlashSale,
  updateItemSoldCount,
} = require("../../controllers/flashSale.controller");

const { protect, authorize } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/image.middleware");

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

// ─── Flash sale validation ──────────────────────────────────────
const flashSaleValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Max 200 characters"),
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Invalid start time"),
  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("Invalid end time"),
  body("items")
    .optional()
    .isArray()
    .withMessage("Items must be an array"),
  validate,
];

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════
// GET  /api/flash-sales/active → get active flash sale

router.get("/test", (req, res) => {
  console.log("Flash sale test endpoint hit");
  res.json({ success: true, message: "Flash sale routes working" });
});

router.get("/active", getActiveFlashSale);

// ════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════
// POST   /api/flash-sales                    → create flash sale
// GET    /api/flash-sales/admin/all          → all flash sales
// GET    /api/flash-sales/:id                 → single flash sale
// PUT    /api/flash-sales/:id                 → update flash sale
// DELETE /api/flash-sales/:id                 → delete flash sale
// PATCH  /api/flash-sales/:flashSaleId/items/:itemId → update sold count

router.post(
  "/test",
  (req, res) => {
    console.log("POST test endpoint hit", req.body);
    res.json({ success: true, message: "POST test working", body: req.body });
  }
);

router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("bannerImage"),
  createFlashSale
);
router.get("/admin/all", protect, authorize("admin"), getAllFlashSales);
router.get("/:id", protect, authorize("admin"), getFlashSaleById);
router.put("/:id", protect, authorize("admin"), updateFlashSale);
router.delete("/:id", protect, authorize("admin"), deleteFlashSale);
router.patch("/:flashSaleId/items/:itemId", protect, updateItemSoldCount);

module.exports = router;
