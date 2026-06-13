const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const {
  placeOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getVendorOrders,
  updateItemStatus,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  getOrderStats,
} = require("../../controllers/order.controller");

const { protect, authorize } = require("../../middlewares/auth.middleware");

// ─── Validation helper ─────────────────────────────────────────
const validate = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fmt = errors.array().reduce((acc, e) => { acc[e.path] = e.msg; return acc; }, {});
    return res.status(422).json({ success: false, message: "Validation failed", errors: fmt });
  }
  next();
};

const placeOrderValidation = [
  body("items")
    .isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.productId")
    .notEmpty().withMessage("Product ID is required")
    .isMongoId().withMessage("Invalid product ID"),
  body("items.*.quantity")
    .notEmpty().withMessage("Quantity is required")
    .isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("shippingAddress.fullName")
    .trim().notEmpty().withMessage("Full name is required"),
  body("shippingAddress.phone")
    .trim().notEmpty().withMessage("Phone number is required"),
  body("shippingAddress.address")
    .trim().notEmpty().withMessage("Address is required"),
  body("shippingAddress.city")
    .trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.district")
    .trim().notEmpty().withMessage("District is required"),
  body("paymentMethod")
    .notEmpty().withMessage("Payment method is required")
    .isIn(["sslcommerz", "stripe", "cod", "bkash"])
    .withMessage("Invalid payment method"),
  validate,
];

// ══════════════════════════════════════════════════════════════
// CUSTOMER ROUTES
// ══════════════════════════════════════════════════════════════

// POST  /api/orders                → place order
// GET   /api/orders/my-orders      → customer's own orders
// GET   /api/orders/:id            → order detail
// PATCH /api/orders/:id/cancel     → cancel order

router.post(  "/",          protect, authorize("customer"), placeOrderValidation, placeOrder);
router.get(   "/my-orders", protect, authorize("customer"), getMyOrders);
router.get(   "/:id",       protect, getOrderDetail);
router.patch( "/:id/cancel",protect, authorize("customer"), cancelOrder);

// ══════════════════════════════════════════════════════════════
// VENDOR ROUTES
// ══════════════════════════════════════════════════════════════

// GET   /api/orders/vendor/my-orders                       → vendor's orders
// PATCH /api/orders/:orderId/items/:itemId/status          → update item status

router.get(   "/vendor/my-orders",                    protect, authorize("vendor"), getVendorOrders);
router.patch( "/:orderId/items/:itemId/status",        protect, authorize("vendor"), updateItemStatus);

// ══════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════

// GET   /api/orders/admin/all          → all orders
// GET   /api/orders/admin/stats        → dashboard stats
// PATCH /api/orders/admin/:id/status   → update order status

router.get(   "/admin/all",          protect, authorize("admin"), adminGetAllOrders);
router.get(   "/admin/stats",        protect, authorize("admin"), getOrderStats);
router.patch( "/admin/:id/status",   protect, authorize("admin"), adminUpdateOrderStatus);

module.exports = router;