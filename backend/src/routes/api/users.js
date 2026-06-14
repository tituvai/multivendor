const express = require("express");
const router = express.Router();

const { getAllUsers, toggleUserActive } = require("../../controllers/user.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");

router.use(protect, authorize("admin"));

router.get("/", getAllUsers);
router.patch("/:userId/toggle-active", toggleUserActive);

module.exports = router;
