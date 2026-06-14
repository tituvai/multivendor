const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/image.middleware");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const { uploadAvatar, uploadShopBanner } = require("../../controllers/upload.controller");

router.post("/avatar", protect, upload.single("image"), uploadAvatar);
router.post("/shop-banner", protect, authorize("vendor"), upload.single("banner"), uploadShopBanner);

module.exports = router;
