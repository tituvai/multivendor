const express = require("express");
const router  = express.Router();
const { body, param } = require("express-validator");




const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  adminGetAllProducts,
  approveProduct,
  rejectProduct,
  addReview,
  toggleFeatured,
  getProductStats,
} = require("../../controllers/product.controller");

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

// ─── Product create/update validation ────────────────────────
const productValidation = [
  body("name")
    .trim().notEmpty().withMessage("Product name is required")
    .isLength({ max: 200 }).withMessage("Max 200 characters"),
  body("description")
    .trim().notEmpty().withMessage("Description is required"),
  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock")
    .notEmpty().withMessage("Stock is required")
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("category")
    .notEmpty().withMessage("Category is required")
    .isMongoId().withMessage("Invalid category ID"),
  body("discountPrice")
    .optional()
    .isFloat({ min: 0 }).withMessage("Discount price must be positive"),
  validate,
];

const reviewValidation = [
  body("rating")
    .notEmpty().withMessage("Rating is required")
    .isInt({ min: 1, max: 5 }).withMessage("Rating must be 1 to 5"),
  body("comment")
    .trim().notEmpty().withMessage("Comment is required")
    .isLength({ max: 500 }).withMessage("Comment max 500 characters"),
  validate,
];

// ══════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════
// GET  /api/products                → all active products (filter, search, paginate)
// GET  /api/products/:idOrSlug      → single product detail

router.get("/",            getProducts);
router.get("/:idOrSlug",   getProduct);

// ══════════════════════════════════════════════════════
// VENDOR ROUTES
// ══════════════════════════════════════════════════════
// POST   /api/products                    → create product
// GET    /api/products/vendor/my-products → vendor's own products
// PUT    /api/products/:id                → update own product
// DELETE /api/products/:id                → delete own product

router.post(  "/create_product", protect, authorize("vendor"), upload.array("images", 5), productValidation, createProduct);
router.get(   "/vendor/my-products",    protect, authorize("vendor"), getMyProducts);
router.put(   "/:id", protect, authorize("vendor", "admin"), updateProduct);
router.delete("/:id", protect, authorize("vendor", "admin"), deleteProduct);

// ══════════════════════════════════════════════════════
// CUSTOMER ROUTES
// ══════════════════════════════════════════════════════
// POST /api/products/:id/reviews → add review

router.post("/:id/reviews", protect, authorize("customer"), reviewValidation, addReview);

// ══════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════
// GET   /api/products/admin/all         → all products any status
// GET   /api/products/admin/stats       → dashboard stats
// PATCH /api/products/:id/approve       → approve product
// PATCH /api/products/:id/reject        → reject with reason
// PATCH /api/products/:id/featured      → toggle featured

router.get(   "/admin/all",       protect, authorize("admin"), adminGetAllProducts);
router.get(   "/admin/stats",     protect, authorize("admin"), getProductStats);
router.patch( "/:id/approve",     protect, authorize("admin"), approveProduct);
router.patch( "/:id/reject",      protect, authorize("admin"), rejectProduct);
router.patch( "/:id/featured",    protect, authorize("admin"), toggleFeatured);

module.exports = router;