const Banner = require("../models/bannerSchema");
const uploadImage = require("../middlewares/cloudinary.middleware");

// ════════════════════════════════════════════════════════════════
// @desc    Create banner (Admin)
// @route   POST /api/banners
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const createBanner = async (req, res) => {
  try {
    const { category, position, isActive, order } = req.body;

    // Validation
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Handle image upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const result = await uploadImage(req.file.path);
    const image = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    const banner = await Banner.create({
      image,
      category,
      position: position || "hero",
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      createdBy: req.user._id,
    });

    await banner.populate("category", "name slug");

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("createBanner Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get all active banners (Public)
// @route   GET /api/banners
// @access  Public
// ════════════════════════════════════════════════════════════════
const getActiveBanners = async (req, res) => {
  try {
    const { position } = req.query;
    const filter = { isActive: true };
    if (position) filter.position = position;

    const banners = await Banner.find(filter)
      .populate("category", "name slug")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error("getActiveBanners Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin/all
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, position, isActive } = req.query;
    const filter = {};
    if (position) filter.position = position;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [banners, total] = await Promise.all([
      Banner.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Banner.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: banners.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: banners,
    });
  } catch (error) {
    console.error("getAllBanners Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get single banner (Admin)
// @route   GET /api/banners/:id
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate("category", "name slug");
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("getBannerById Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Update banner (Admin)
// @route   PUT /api/banners/:id
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const updateBanner = async (req, res) => {
  try {
    const { category, position, isActive, order } = req.body;

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Handle image upload if new image provided
    if (req.file) {
      const result = await uploadImage(req.file.path);
      banner.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    if (category !== undefined) banner.category = category;
    if (position !== undefined) banner.position = position;
    if (isActive !== undefined) banner.isActive = isActive;
    if (order !== undefined) banner.order = order;

    await banner.save();
    await banner.populate("category", "name slug");

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("updateBanner Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Delete banner (Admin)
// @route   DELETE /api/banners/:id
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image from Cloudinary
    if (banner.image.publicId) {
      const { deleteImage } = require("../middlewares/cloudinary.middleware");
      await deleteImage(banner.image.publicId);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("deleteBanner Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Toggle banner active status (Admin)
// @route   PATCH /api/banners/:id/toggle
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner status updated",
      data: { isActive: banner.isActive },
    });
  } catch (error) {
    console.error("toggleBannerStatus Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
};
