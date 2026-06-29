const express = require("express");
const router = express.Router();
const {
  createBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} = require("../../controllers/banner.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/image.middleware");

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════
// GET  /api/banners → get active banners
// GET  /api/banners/:id → get single banner (public)

router.get("/", getActiveBanners);
router.get("/:id", getBannerById);

// ════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════
// POST   /api/banners                    → create banner
// GET    /api/banners/admin/all          → all banners
// PUT    /api/banners/:id                 → update banner
// DELETE /api/banners/:id                 → delete banner
// PATCH  /api/banners/:id/toggle          → toggle active status

router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createBanner
);
router.get("/admin/all", protect, authorize("admin"), getAllBanners);
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateBanner);
router.delete("/:id", protect, authorize("admin"), deleteBanner);
router.patch("/:id/toggle", protect, authorize("admin"), toggleBannerStatus);

module.exports = router;
