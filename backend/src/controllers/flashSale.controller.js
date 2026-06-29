const FlashSale = require("../models/flashSaleSchema");
const Product = require("../models/productSchema");
const uploadImage = require("../middlewares/cloudinary.middleware");

// ════════════════════════════════════════════════════════════════
// @desc    Create flash sale (Admin)
// @route   POST /api/flash-sales
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const createFlashSale = async (req, res) => {
  try {
    console.log("=== Create Flash Sale ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { title, description, startTime, endTime, items } = req.body;

    // Validation
    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Title, start time, and end time are required",
      });
    }

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Validate items (optional)
    let validItems = [];
    if (items) {
      try {
        const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
        if (itemsArray && itemsArray.length > 0) {
          for (const item of itemsArray) {
            const product = await Product.findById(item.product);
            if (!product) {
              return res.status(404).json({
                success: false,
                message: `Product ${item.product} not found`,
              });
            }

            validItems.push({
              product: item.product,
              originalPrice: product.price,
              discountPrice: item.discountPrice,
              discountPercent: Math.round(((product.price - item.discountPrice) / product.price) * 100),
              stockLimit: item.stockLimit || product.stock,
              soldCount: 0,
              isActive: true,
            });
          }
        }
      } catch (e) {
        console.error("Error parsing items:", e);
      }
    }

    // Handle banner image (optional)
    let bannerImage = { url: "", publicId: "" };
    if (req.file) {
      try {
        const result = await uploadImage(req.file.path);
        bannerImage = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (e) {
        console.error("Image upload error:", e);
        // Continue without image if upload fails
      }
    }

    console.log("Creating flash sale with data:", { title, startTime, endTime, itemsCount: validItems.length });

    const flashSale = await FlashSale.create({
      title,
      description,
      bannerImage,
      startTime: start,
      endTime: end,
      items: validItems,
      createdBy: req.user._id,
    });

    await flashSale.populate("items.product", "name slug price images");

    console.log("Flash sale created successfully");

    res.status(201).json({
      success: true,
      message: "Flash sale created successfully",
      data: flashSale,
    });
  } catch (error) {
    console.error("createFlashSale Error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get all flash sales (Admin)
// @route   GET /api/flash-sales/admin/all
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const getAllFlashSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [flashSales, total] = await Promise.all([
      FlashSale.find(filter)
        .populate("createdBy", "name email")
        .populate("items.product", "name slug price images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FlashSale.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: flashSales.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: flashSales,
    });
  } catch (error) {
    console.error("getAllFlashSales Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get active flash sale (Public)
// @route   GET /api/flash-sales/active
// @access  Public
// ════════════════════════════════════════════════════════════════
const getActiveFlashSale = async (req, res) => {
  try {
    const now = new Date();
    
    const flashSale = await FlashSale.findOne({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now },
      "items.0": { $exists: true },
    })
      .sort({ createdAt: -1 })
      .populate("items.product", "name slug price images stock discountPrice")
      .lean();

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: "No active flash sale",
      });
    }

    // Increment view count
    await FlashSale.findByIdAndUpdate(flashSale._id, { $inc: { totalViews: 1 } });

    res.status(200).json({
      success: true,
      data: flashSale,
    });
  } catch (error) {
    console.error("getActiveFlashSale Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get single flash sale by ID (Admin)
// @route   GET /api/flash-sales/:id
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const getFlashSaleById = async (req, res) => {
  try {
    const flashSale = await FlashSale.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("items.product", "name slug price images stock")
      .lean();

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: "Flash sale not found",
      });
    }

    res.status(200).json({
      success: true,
      data: flashSale,
    });
  } catch (error) {
    console.error("getFlashSaleById Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Update flash sale (Admin)
// @route   PUT /api/flash-sales/:id
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const updateFlashSale = async (req, res) => {
  try {
    const { title, description, startTime, endTime, items, isActive } = req.body;

    const flashSale = await FlashSale.findById(req.params.id);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: "Flash sale not found",
      });
    }

    // Update basic fields
    if (title) flashSale.title = title;
    if (description !== undefined) flashSale.description = description;
    if (startTime) flashSale.startTime = new Date(startTime);
    if (endTime) flashSale.endTime = new Date(endTime);
    if (isActive !== undefined) flashSale.isActive = isActive;

    // Update items if provided
    if (items && items.length > 0) {
      const validItems = [];
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) continue;

        validItems.push({
          product: item.product,
          originalPrice: product.price,
          discountPrice: item.discountPrice,
          discountPercent: Math.round(((product.price - item.discountPrice) / product.price) * 100),
          stockLimit: item.stockLimit || product.stock,
          soldCount: item.soldCount || 0,
          isActive: item.isActive !== undefined ? item.isActive : true,
        });
      }
      flashSale.items = validItems;
    }

    await flashSale.save();
    await flashSale.populate("items.product", "name slug price images");

    res.status(200).json({
      success: true,
      message: "Flash sale updated successfully",
      data: flashSale,
    });
  } catch (error) {
    console.error("updateFlashSale Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Delete flash sale (Admin)
// @route   DELETE /api/flash-sales/:id
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const deleteFlashSale = async (req, res) => {
  try {
    const flashSale = await FlashSale.findById(req.params.id);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: "Flash sale not found",
      });
    }

    await FlashSale.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Flash sale deleted successfully",
    });
  } catch (error) {
    console.error("deleteFlashSale Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Update flash sale item sold count (Internal)
// @route   PATCH /api/flash-sales/:flashSaleId/items/:itemId
// @access  Private — Internal
// ════════════════════════════════════════════════════════════════
const updateItemSoldCount = async (req, res) => {
  try {
    const { flashSaleId, itemId } = req.params;
    const { quantity = 1 } = req.body;

    const flashSale = await FlashSale.findById(flashSaleId);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: "Flash sale not found",
      });
    }

    const item = flashSale.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.soldCount += quantity;
    flashSale.totalSales += quantity;
    await flashSale.save();

    res.status(200).json({
      success: true,
      data: { soldCount: item.soldCount },
    });
  } catch (error) {
    console.error("updateItemSoldCount Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Auto expire flash sales (Cron Job)
// @route   Internal
// @access  Internal
// ════════════════════════════════════════════════════════════════
const autoExpireFlashSales = async () => {
  try {
    const now = new Date();
    
    const result = await FlashSale.updateMany(
      {
        isActive: true,
        endTime: { $lt: now },
      },
      {
        isActive: false,
        status: "expired",
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Auto-expired ${result.modifiedCount} flash sales`);
    }
  } catch (error) {
    console.error("autoExpireFlashSales Error:", error);
  }
};

module.exports = {
  createFlashSale,
  getAllFlashSales,
  getActiveFlashSale,
  getFlashSaleById,
  updateFlashSale,
  deleteFlashSale,
  updateItemSoldCount,
  autoExpireFlashSales,
};
