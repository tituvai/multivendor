const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

const {
  createCategory,
  getCategoryTree,
  getAllCategories,
  getCategory,
  getFeaturedCategories,
  updateCategory,
  deleteCategory,
  reorderCategories,
  toggleCategoryStatus,
  getCategoryStats,
} = require("../../controllers/category.controller");

const { protect, authorize } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/image.middleware");

// ─── Validation helpers ───────────────────────────────────────
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

const createValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 80 }).withMessage("Max 80 characters"),
  body("commission").optional().isFloat({ min: 0, max: 100 }).withMessage("Commission must be 0–100"),
  body("parent").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("Invalid parent ID"),
  validate,
];

const updateValidation = [
  param("id").isMongoId().withMessage("Invalid category ID"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 80 }),
  body("commission").optional().isFloat({ min: 0, max: 100 }).withMessage("Commission must be 0–100"),
  body("parent").optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage("Invalid parent ID"),
  validate,
];

// ══════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ══════════════════════════════════════════════════════

// GET /api/categories/tree          → Nested tree
// GET /api/categories/featured      → Featured categories (homepage)
// GET /api/categories               → Flat list with filters & pagination
// GET /api/categories/:idOrSlug     → Single category + children + breadcrumb

router.get("/tree",     getCategoryTree);
router.get("/featured", getFeaturedCategories);
router.get("/", getAllCategories);
router.get("/:idOrSlug", getCategory);


// ══════════════════════════════════════════════════════
//  PRIVATE ROUTES — Admin only
// ══════════════════════════════════════════════════════

// GET    /api/categories/admin/stats       → Dashboard stats
// POST   /api/categories                   → Create
// PUT    /api/categories/reorder           → Bulk reorder (drag & drop)
// PUT    /api/categories/:id               → Update
// PATCH  /api/categories/:id/toggle        → Toggle active status
// DELETE /api/categories/:id              → Delete (?force=true for cascade)

router.use(protect, authorize("admin")); // all routes below require admin

router.get("/admin/stats", getCategoryStats);
router.post("/", upload.single('image'), createValidation, createCategory);
router.put("/reorder",reorderCategories);
router.put("/:id", upload.single('image'), updateValidation, updateCategory);
router.patch("/:id/toggle", toggleCategoryStatus);
router.delete("/:id",deleteCategory);

module.exports = router;