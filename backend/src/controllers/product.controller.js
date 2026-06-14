const Product = require("../models/productSchema");
const Category = require("../models/categoriSchema");
const uploadImage = require("../middlewares/cloudinary.middleware");


// ════════════════════════════════════════════════════════════════
// HELPER: Build filter object from query params
// ════════════════════════════════════════════════════════════════
const buildProductFilter = (query, extraFilter = {}) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    rating,
    inStock,
    tags,
    vendor,
    status,
    isFeatured,
  } = query;




  const filter = { ...extraFilter };

  // Full-text search
  if (search) {
    filter.$text = { $search: search };
  }

  // Category (includes subcategory check)
  if (category) {
    filter.$or = [
      { category },
      { subcategory: category },
    ];
  }

  // Price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Minimum rating
  if (rating) {
    filter["ratings.average"] = { $gte: Number(rating) };
  }

  // In stock only
  if (inStock === "true") {
    filter.stock = { $gt: 0 };
  }

  // Tags
  if (tags) {
    filter.tags = { $in: tags.split(",").map((t) => t.trim().toLowerCase()) };
  }

  // Vendor filter
  if (vendor) filter.vendor = vendor;

  // Status filter
  if (status) filter.status = status;

  // Featured
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

  return filter;
};

// ════════════════════════════════════════════════════════════════
// @desc    Create product (vendor)
// @route   POST /api/products
// @access  Private — Vendor only
// ════════════════════════════════════════════════════════════════
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      discountPrice,
      stock,
      sku,
      category,
      subcategory,
      tags,
      hasVariants,
      variants,
      shipping,
      metaTitle,
      metaDescription,
      images,
      saveDraft,
    } = req.body;

    
      let uploadedImages = [];

if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    const result = await uploadImage(file.path);

    uploadedImages.push({
      url: result.secure_url,
      publicId: result.public_id,
    });
  }
}


    // ── Vendor approval check ──────────────────────────────────
    if (!req.user.vendorInfo?.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your vendor account is not approved yet.",
      });
    }

    // ── Category check ─────────────────────────────────────────
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc || !categoryDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive.",
      });
    }

    // ── SKU duplicate check ────────────────────────────────────
    if (sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(409).json({
          success: false,
          message: "A product with this SKU already exists.",
        });
      }
    }

    // ── Create product ─────────────────────────────────────────
    const product = await Product.create({
      name,
      description,
      shortDescription,
      price,
      discountPrice: discountPrice || 0,
      stock,
      sku,
      category,
      subcategory: subcategory || null,
      tags: tags || [],
      hasVariants: hasVariants || false,
      variants: variants || [],
      shipping: shipping || {},
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || shortDescription || "",
      images: uploadedImages,
      vendor: req.user._id,
      commissionRate: categoryDoc.commission,
      status: saveDraft ? "draft" : "pending", 
      
    });

    // ── Update category product count ──────────────────────────
    await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

    res.status(201).json({
      success: true,
      message: saveDraft
        ? "Product saved as draft."
        : "Product submitted for admin approval.",
      data: product,
    });
  } catch (error) {
    console.error("createProduct Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get all products (public — active only, with filters)
// @route   GET /api/products
// @access  Public
// ════════════════════════════════════════════════════════════════
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Public only sees active products
    const filter = buildProductFilter(req.query, { status: "active" });

    // Sorting
    const sortOptions = {
      createdAt: "createdAt",
      price: "price",
      rating: "ratings.average",
      sales: "salesCount",
      popular: "viewCount",
    };
    const sortField = sortOptions[sortBy] || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    // Text search score sorting
    const sort =
      req.query.search
        ? { score: { $meta: "textScore" }, [sortField]: sortOrder }
        : { [sortField]: sortOrder };

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip     = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter, req.query.search ? { score: { $meta: "textScore" } } : {})
        .populate("category",    "name slug")
        .populate("subcategory", "name slug")
        .populate("vendor",      "name avatar vendorInfo.shopName")
        .select("-reviews -__v")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    console.error("getProducts Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get single product by id or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
// ════════════════════════════════════════════════════════════════
const getProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const filter = isObjectId
      ? { _id: idOrSlug, status: "active" }
      : { slug: idOrSlug, status: "active" };

    const product = await Product.findOne(filter)
      .populate("category",    "name slug ancestors")
      .populate("subcategory", "name slug")
      .populate("vendor",      "name avatar vendorInfo.shopName vendorInfo.shopDescription")
      .populate("reviews.user","name avatar");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Increment view count (fire & forget)
    Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

    // Breadcrumb from category ancestors
    const breadcrumb = [
      ...product.category.ancestors.map((a) => ({ name: a.name, slug: a.slug })),
      { name: product.category.name, slug: product.category.slug },
      { name: product.name, slug: product.slug },
    ];

    // Related products (same category, exclude current)
    const related = await Product.find({
      category: product.category._id,
      status: "active",
      _id: { $ne: product._id },
    })
      .limit(6)
      .select("name slug price discountPrice images ratings stock")
      .lean();

    res.status(200).json({
      success: true,
      data: { ...product.toObject(), breadcrumb, related },
    });
  } catch (error) {
    console.error("getProduct Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Update product (vendor — only their own products)
// @route   PUT /api/products/:id
// @access  Private — Vendor
// ════════════════════════════════════════════════════════════════
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Ownership check
    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own products.",
      });
    }

    // Cannot edit rejected/archived without re-submitting
    if (["archived"].includes(product.status)) {
      return res.status(400).json({
        success: false,
        message: "Archived products cannot be edited.",
      });
    }

    const allowedFields = [
      "name", "description", "shortDescription", "price",
      "discountPrice", "stock", "sku", "tags", "hasVariants",
      "variants", "shipping", "metaTitle", "metaDescription",
      "subcategory", "lowStockThreshold",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const img = await uploadImage(file.path);
          return {
            url: img.secure_url,
            publicId: img.public_id,
          };
        })
      );
      product.images = uploadedImages;
    } else if (req.body.images && Array.isArray(req.body.images)) {
      // If no new files but images array is provided in body, use it
      product.images = req.body.images;
    }

    // Category change — update commission rate
    if (req.body.category && req.body.category !== product.category.toString()) {
      const newCategory = await Category.findById(req.body.category);
      if (!newCategory || !newCategory.isActive) {
        return res.status(404).json({ success: false, message: "Category not found." });
      }
      // Update old & new category product counts
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
      await Category.findByIdAndUpdate(req.body.category,  { $inc: { productCount:  1 } });
      product.category       = req.body.category;
      product.commissionRate = newCategory.commission;
    }

    // Re-editing a rejected product resets to pending
    if (product.status === "rejected") {
      product.status          = "pending";
      product.rejectionReason = "";
    }

    // Save as draft or re-submit
    if (req.body.saveDraft) {
      product.status = "draft";
    } else if (req.body.submit && product.status === "draft") {
      product.status = "pending";
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    console.error("updateProduct Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Delete product (vendor — own product only)
// @route   DELETE /api/products/:id
// @access  Private — Vendor / Admin
// ════════════════════════════════════════════════════════════════
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Vendor can only delete their own product
    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    await product.deleteOne();

    // Update category count
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

    res.status(200).json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error("deleteProduct Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get vendor's own products (all statuses)
// @route   GET /api/products/vendor/my-products
// @access  Private — Vendor
// ════════════════════════════════════════════════════════════════
const getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const filter = { vendor: req.user._id };
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip     = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .select("-reviews")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Status summary counts
    const statusCounts = await Product.aggregate([
      { $match: { vendor: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const summary = statusCounts.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      summary, // { active: 5, pending: 2, draft: 1, ... }
      data: products,
    });
  } catch (error) {
    console.error("getMyProducts Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Admin — get all products (any status)
// @route   GET /api/products/admin/all
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const adminGetAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, vendor, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (search) filter.$text = { $search: search };

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip     = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("vendor",   "name email vendorInfo.shopName")
        .populate("category", "name slug")
        .select("-reviews -description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    console.error("adminGetAllProducts Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Admin — Approve product
// @route   PATCH /api/products/:id/approve
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a product with status '${product.status}'.`,
      });
    }

    product.status      = "active";
    product.approvedBy  = req.user._id;
    product.approvedAt  = new Date();
    product.rejectionReason = "";
    await product.save();

    // TODO: notify vendor via email/socket

    res.status(200).json({
      success: true,
      message: "Product approved and is now live.",
      data: { status: product.status, approvedAt: product.approvedAt },
    });
  } catch (error) {
    console.error("approveProduct Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Admin — Reject product with reason
// @route   PATCH /api/products/:id/reject
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const rejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    product.status          = "rejected";
    product.rejectionReason = reason.trim();
    await product.save();

    // TODO: notify vendor via email

    res.status(200).json({
      success: true,
      message: "Product rejected.",
      data: { status: product.status, rejectionReason: product.rejectionReason },
    });
  } catch (error) {
    console.error("rejectProduct Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Add review to product
// @route   POST /api/products/:id/reviews
// @access  Private — Customer
// ════════════════════════════════════════════════════════════════
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || product.status !== "active") {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // One review per user
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    // TODO: check if user actually purchased this product
    // const hasPurchased = await Order.findOne({ user: req.user._id, "items.product": product._id, status: "delivered" });
    // if (!hasPurchased) return 403...

    product.reviews.push({
      user:    req.user._id,
      name:    req.user.name,
      avatar:  req.user.avatar || "",
      rating:  Number(rating),
      comment: comment.trim(),
    });

    product.recalculateRatings();
    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
      data: {
        ratings: product.ratings,
        review: product.reviews[product.reviews.length - 1],
      },
    });
  } catch (error) {
    console.error("addReview Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Toggle product featured status (Admin)
// @route   PATCH /api/products/:id/featured
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isFeatured ? "added to" : "removed from"} featured.`,
      data: { isFeatured: product.isFeatured },
    });
  } catch (error) {
    console.error("toggleFeatured Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════════════════
// @desc    Get product stats for admin dashboard
// @route   GET /api/products/admin/stats
// @access  Private — Admin
// ════════════════════════════════════════════════════════════════
const getProductStats = async (req, res) => {
  try {
    const [stats] = await Product.aggregate([
      {
        $group: {
          _id: null,
          total:    { $sum: 1 },
          active:   { $sum: { $cond: [{ $eq: ["$status", "active"]   }, 1, 0] } },
          pending:  { $sum: { $cond: [{ $eq: ["$status", "pending"]  }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
          draft:    { $sum: { $cond: [{ $eq: ["$status", "draft"]    }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
          totalSales: { $sum: "$salesCount" },
          avgPrice:   { $avg: "$price" },
        },
      },
    ]);

    // Top selling products
    const topSelling = await Product.find({ status: "active" })
      .sort({ salesCount: -1 })
      .limit(5)
      .select("name slug salesCount price ratings images")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview: stats || {},
        topSelling,
      },
    });
  } catch (error) {
    console.error("getProductStats Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
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
};