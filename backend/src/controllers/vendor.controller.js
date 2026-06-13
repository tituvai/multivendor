const User    = require("../models/userSchema");
const Product = require("../models/productSchema");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  TRANSFORM_PRESETS,
} = require("../config/cloudinary");
const {
  sendVendorApplicationEmail,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendVendorSuspendedEmail,
} = require("../utils/vendor.email.utiles");

// ═══════════════════════════════════════════════════════════════
// @desc    Apply to become a vendor
// @route   POST /api/vendors/apply
// @access  Private — Customer only (role: customer)
// ═══════════════════════════════════════════════════════════════
const applyAsVendor = async (req, res) => {
  try {
    const {
      shopName,
      shopDescription,
      shopAddress,
      shopPhone,
      shopEmail,
      nidNumber,
    } = req.body;

    const user = await User.findById(req.user._id);

    // ── Already a vendor / pending ─────────────────────────────
    if (user.role === "vendor") {
      return res.status(400).json({
        success: false,
        message: "You are already a vendor.",
      });
    }

    if (user.vendorInfo?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your application is already under review.",
      });
    }

    if (user.vendorInfo?.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your vendor account is suspended. Please contact support.",
      });
    }

    // ── Shop name duplicate check ──────────────────────────────
    const shopNameTaken = await User.findOne({
      "vendorInfo.shopName": { $regex: `^${shopName}$`, $options: "i" },
      _id: { $ne: user._id },
    });

    if (shopNameTaken) {
      return res.status(409).json({
        success: false,
        message: "This shop name is already taken. Please choose another.",
      });
    }

    // ── Handle document uploads (NID, trade license) ───────────
    let nidImageUrl    = "";
    let tradeLicenseUrl = "";

    if (req.files) {
      // NID image
      if (req.files.nidImage?.[0]) {
        const result = await uploadToCloudinary(
          req.files.nidImage[0].buffer,
          "vendor-docs",
          { resource_type: "image", folder: "multivendor/vendor-docs" }
        );
        nidImageUrl = result.url;
      }

      // Trade license
      if (req.files.tradeLicense?.[0]) {
        const result = await uploadToCloudinary(
          req.files.tradeLicense[0].buffer,
          "vendor-docs",
          { resource_type: "image", folder: "multivendor/vendor-docs" }
        );
        tradeLicenseUrl = result.url;
      }
    }

    // ── Update user vendorInfo ─────────────────────────────────
    user.vendorInfo = {
      ...user.vendorInfo,
      shopName:        shopName.trim(),
      shopDescription: shopDescription?.trim() || "",
      shopAddress:     shopAddress?.trim()  || "",
      shopPhone:       shopPhone?.trim()    || "",
      shopEmail:       shopEmail?.trim()    || user.email,
      nidNumber:       nidNumber?.trim()    || "",
      nidImage:        nidImageUrl,
      tradeLicense:    tradeLicenseUrl,
      status:          "pending",
      isApproved:      false,
      appliedAt:       new Date(),
    };

    user.markModified("vendorInfo");
    await user.save();

    // ── Send confirmation email ────────────────────────────────
    try {
      await sendVendorApplicationEmail(user);
    } catch (emailErr) {
      console.error("Vendor application email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Application submitted successfully! We will review it within 2–3 business days.",
    });
  } catch (error) {
    console.error("applyAsVendor Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get current vendor's own profile
// @route   GET /api/vendors/profile
// @access  Private — Vendor
// ═══════════════════════════════════════════════════════════════
const getVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email avatar phone vendorInfo createdAt"
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("getVendorProfile Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Update vendor's own shop info
// @route   PUT /api/vendors/profile
// @access  Private — Vendor
// ═══════════════════════════════════════════════════════════════
const updateVendorProfile = async (req, res) => {
  try {
    const {
      shopName,
      shopDescription,
      shopAddress,
      shopPhone,
      shopEmail,
    } = req.body;

    const user = await User.findById(req.user._id);

    // Shop name change — check duplicate
    if (shopName && shopName !== user.vendorInfo.shopName) {
      const taken = await User.findOne({
        "vendorInfo.shopName": { $regex: `^${shopName}$`, $options: "i" },
        _id: { $ne: user._id },
      });
      if (taken) {
        return res.status(409).json({
          success: false,
          message: "This shop name is already taken.",
        });
      }
      user.vendorInfo.shopName = shopName.trim();
    }

    if (shopDescription !== undefined) user.vendorInfo.shopDescription = shopDescription.trim();
    if (shopAddress     !== undefined) user.vendorInfo.shopAddress     = shopAddress.trim();
    if (shopPhone       !== undefined) user.vendorInfo.shopPhone       = shopPhone.trim();
    if (shopEmail       !== undefined) user.vendorInfo.shopEmail       = shopEmail.trim();

    user.markModified("vendorInfo");
    await user.save();

    res.status(200).json({
      success: true,
      message: "Shop profile updated successfully.",
      data: user.vendorInfo,
    });
  } catch (error) {
    console.error("updateVendorProfile Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Public vendor/shop page info
// @route   GET /api/vendors/:vendorId/shop
// @access  Public
// ═══════════════════════════════════════════════════════════════
const getPublicVendorShop = async (req, res) => {
  try {
    const vendor = await User.findOne({
      _id: req.params.vendorId,
      role: "vendor",
      "vendorInfo.isApproved": true,
    }).select("name avatar vendorInfo.shopName vendorInfo.shopDescription vendorInfo.shopBanner vendorInfo.shopAddress vendorInfo.shopPhone vendorInfo.shopEmail vendorInfo.rating vendorInfo.totalSales createdAt");

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor shop not found." });
    }

    // Get vendor's active products
    const { page = 1, limit = 12 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [products, total] = await Promise.all([
      Product.find({ vendor: vendor._id, status: "active" })
        .populate("category", "name slug")
        .select("name slug price discountPrice images ratings stock salesCount")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Product.countDocuments({ vendor: vendor._id, status: "active" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        vendor,
        products,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getPublicVendorShop Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — get all vendor applications (pending/all)
// @route   GET /api/vendors/admin/applications
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const getVendorApplications = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 20,
      status = "pending",   // pending | approved | rejected | suspended | all
      search,
    } = req.query;

    const filter = { "vendorInfo.status": { $ne: "none" } };

    if (status !== "all") {
      filter["vendorInfo.status"] = status;
    }

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "vendorInfo.shopName": { $regex: search, $options: "i" } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip     = (pageNum - 1) * limitNum;

    const [vendors, total, statusCounts] = await Promise.all([
      User.find(filter)
        .select("name email avatar phone vendorInfo createdAt lastLogin")
        .populate("vendorInfo.reviewedBy", "name email")
        .sort({ "vendorInfo.appliedAt": -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
      // Status summary
      User.aggregate([
        { $match: { "vendorInfo.status": { $ne: "none" } } },
        { $group: { _id: "$vendorInfo.status", count: { $sum: 1 } } },
      ]),
    ]);

    const summary = statusCounts.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: vendors.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      summary,  // { pending: 5, approved: 12, rejected: 2, ... }
      data: vendors,
    });
  } catch (error) {
    console.error("getVendorApplications Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — get single vendor details
// @route   GET /api/vendors/admin/:vendorId
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const getVendorDetails = async (req, res) => {
  try {
    const vendor = await User.findById(req.params.vendorId)
      .select("-password -refreshToken -emailVerifyToken -resetPasswordToken")
      .populate("vendorInfo.reviewedBy", "name email");

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    // Vendor's product summary
    const productStats = await Product.aggregate([
      { $match: { vendor: vendor._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const products = productStats.reduce((acc, p) => {
      acc[p._id] = p.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: { ...vendor.toObject(), productSummary: products },
    });
  } catch (error) {
    console.error("getVendorDetails Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — Approve vendor
// @route   PATCH /api/vendors/admin/:vendorId/approve
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const approveVendor = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const user = await User.findById(req.params.vendorId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.vendorInfo?.status === "approved") {
      return res.status(400).json({ success: false, message: "Vendor is already approved." });
    }

    if (!["pending", "rejected"].includes(user.vendorInfo?.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or rejected applications can be approved.",
      });
    }

    // ── Update user ────────────────────────────────────────────
    user.role = "vendor";

    user.vendorInfo.status          = "approved";
    user.vendorInfo.isApproved      = true;
    user.vendorInfo.approvedAt      = new Date();
    user.vendorInfo.rejectionReason = "";
    user.vendorInfo.rejectedAt      = undefined;
    user.vendorInfo.adminNote       = adminNote || "";
    user.vendorInfo.reviewedBy      = req.user._id;

    user.markModified("vendorInfo");
    await user.save();

    // ── Send approval email ────────────────────────────────────
    try {
      const loginUrl = `${process.env.CLIENT_URL}/vendor/dashboard`;
      await sendVendorApprovedEmail(user, loginUrl);
    } catch (emailErr) {
      console.error("Vendor approval email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `${user.name}'s vendor account has been approved. Approval email sent.`,
      data: {
        userId:    user._id,
        name:      user.name,
        email:     user.email,
        shopName:  user.vendorInfo.shopName,
        status:    user.vendorInfo.status,
        approvedAt: user.vendorInfo.approvedAt,
      },
    });
  } catch (error) {
    console.error("approveVendor Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — Reject vendor application
// @route   PATCH /api/vendors/admin/:vendorId/reject
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const rejectVendor = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const user = await User.findById(req.params.vendorId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.vendorInfo?.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be rejected.",
      });
    }

    user.vendorInfo.status          = "rejected";
    user.vendorInfo.isApproved      = false;
    user.vendorInfo.rejectionReason = reason.trim();
    user.vendorInfo.rejectedAt      = new Date();
    user.vendorInfo.reviewedBy      = req.user._id;

    user.markModified("vendorInfo");
    await user.save();

    // ── Send rejection email ───────────────────────────────────
    try {
      await sendVendorRejectedEmail(user, reason.trim());
    } catch (emailErr) {
      console.error("Vendor rejection email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Application rejected. Rejection email sent to ${user.email}.`,
      data: {
        userId:          user._id,
        status:          user.vendorInfo.status,
        rejectionReason: user.vendorInfo.rejectionReason,
      },
    });
  } catch (error) {
    console.error("rejectVendor Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — Suspend approved vendor
// @route   PATCH /api/vendors/admin/:vendorId/suspend
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const suspendVendor = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Suspend reason is required." });
    }

    const user = await User.findById(req.params.vendorId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    if (user.vendorInfo?.status !== "approved") {
      return res.status(400).json({ success: false, message: "Only approved vendors can be suspended." });
    }

    user.vendorInfo.status        = "suspended";
    user.vendorInfo.isApproved    = false;
    user.vendorInfo.suspendReason = reason.trim();
    user.vendorInfo.suspendedAt   = new Date();
    user.vendorInfo.reviewedBy    = req.user._id;

    user.markModified("vendorInfo");
    await user.save();

    // Hide all vendor's products
    await Product.updateMany(
      { vendor: user._id, status: "active" },
      { $set: { status: "archived" } }
    );

    // ── Send suspension email ──────────────────────────────────
    try {
      await sendVendorSuspendedEmail(user, reason.trim());
    } catch (emailErr) {
      console.error("Vendor suspension email failed:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Vendor suspended. All their products have been archived.`,
      data: { status: user.vendorInfo.status },
    });
  } catch (error) {
    console.error("suspendVendor Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — Reactivate suspended vendor
// @route   PATCH /api/vendors/admin/:vendorId/reactivate
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const reactivateVendor = async (req, res) => {
  try {
    const user = await User.findById(req.params.vendorId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    if (user.vendorInfo?.status !== "suspended") {
      return res.status(400).json({ success: false, message: "Only suspended vendors can be reactivated." });
    }

    user.vendorInfo.status        = "approved";
    user.vendorInfo.isApproved    = true;
    user.vendorInfo.suspendReason = "";
    user.vendorInfo.suspendedAt   = undefined;
    user.vendorInfo.reviewedBy    = req.user._id;

    user.markModified("vendorInfo");
    await user.save();

    res.status(200).json({
      success: true,
      message: "Vendor reactivated successfully. They can now list products again.",
      data: { status: user.vendorInfo.status },
    });
  } catch (error) {
    console.error("reactivateVendor Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — Vendor stats for dashboard
// @route   GET /api/vendors/admin/stats
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const getVendorStats = async (req, res) => {
  try {
    const [stats] = await User.aggregate([
      { $match: { "vendorInfo.status": { $ne: "none" } } },
      {
        $group: {
          _id:       null,
          total:     { $sum: 1 },
          pending:   { $sum: { $cond: [{ $eq: ["$vendorInfo.status", "pending"]   }, 1, 0] } },
          approved:  { $sum: { $cond: [{ $eq: ["$vendorInfo.status", "approved"]  }, 1, 0] } },
          rejected:  { $sum: { $cond: [{ $eq: ["$vendorInfo.status", "rejected"]  }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ["$vendorInfo.status", "suspended"] }, 1, 0] } },
        },
      },
    ]);

    // Top vendors by revenue
    const topVendors = await User.find({
      role: "vendor",
      "vendorInfo.isApproved": true,
    })
      .sort({ "vendorInfo.totalRevenue": -1 })
      .limit(5)
      .select("name avatar vendorInfo.shopName vendorInfo.totalRevenue vendorInfo.totalSales vendorInfo.rating")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview: stats || { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 },
        topVendors,
      },
    });
  } catch (error) {
    console.error("getVendorStats Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
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
};