const uploadImage = require("../middlewares/cloudinary.middleware");
const Category = require("../models/categoriSchema");
const slugify = require("slugify");
const cloudinary = require("cloudinary").v2;

// ═══════════════════════════════════════════════════════════════
// HELPER: Build category tree from flat array (O(n))
// ═══════════════════════════════════════════════════════════════
const buildTree = (categories) => {
  const map = {};
  const roots = [];

  categories.forEach((cat) => {
    map[cat._id.toString()] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    if (cat.parent) {
      const parentId = cat.parent.toString();
      if (map[parentId]) {
        map[parentId].children.push(map[cat._id.toString()]);
      }
    } else {
      roots.push(map[cat._id.toString()]);
    }
  });

  return roots;
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Recursively get all descendant IDs of a category
// ═══════════════════════════════════════════════════════════════
const getAllDescendantIds = async (categoryId) => {
  const children = await Category.find({ parent: categoryId }).select("_id");
  let ids = children.map((c) => c._id);

  for (const child of children) {
    const subIds = await getAllDescendantIds(child._id);
    ids = [...ids, ...subIds];
  }

  return ids;
};

// ═══════════════════════════════════════════════════════════════
// @desc    Create a new category (root or nested)
// @route   POST /api/categories
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      parent,
      commission,
      icon,
      sortOrder,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    let imgUrl = null;
    if (req.file && req.file.path) {
      imgUrl = await uploadImage(req.file.path);
    }

    // ─── Duplicate name check (within same parent) ────────────
    const existingSlug = slugify(name, { lower: true, strict: true });
    const duplicate = await Category.findOne({
      slug: existingSlug,
      parent: parent || null,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists at this level.",
      });
    }

    // ─── Resolve parent — build level & ancestors ─────────────
    let level = 0;
    let ancestors = [];

    if (parent) {
      const parentDoc = await Category.findById(parent);

      if (!parentDoc) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found.",
        });
      }

      if (!parentDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot add a subcategory under a disabled category.",
        });
      }

      // Max depth guard (e.g., 3 levels: 0, 1, 2)
      if (parentDoc.level >= 2) {
        return res.status(400).json({
          success: false,
          message: "Maximum category depth (3 levels) reached.",
        });
      }

      level = parentDoc.level + 1;
      ancestors = [
        ...parentDoc.ancestors,
        {
          _id: parentDoc._id,
          name: parentDoc.name,
          slug: parentDoc.slug,
        },
      ];
    }

    // ─── Create ───────────────────────────────────────────────
    const category = await Category.create({
      name,
      description,
      parent: parent || null,
      level,
      ancestors,
      commission: commission ?? 10,
      icon: icon || "",
      sortOrder: sortOrder ?? 0,
      isFeatured: isFeatured ?? false,
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || description || "",
      createdBy: req.user._id,
      image: imgUrl ? {
        url: imgUrl.secure_url,
        publicId: imgUrl.public_id,
      } : { url: "", publicId: "" },
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    });
  } catch (error) {
    console.error("createCategory Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get all categories as a nested tree
// @route   GET /api/categories/tree
// @access  Public
// ═══════════════════════════════════════════════════════════════
const getCategoryTree = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const filter =
      includeInactive === "true" && req.user?.role === "admin"
        ? {}
        : { isActive: true };

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const tree = buildTree(categories);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: tree,
    });
  } catch (error) {
    console.error("getCategoryTree Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get all categories flat list (for admin table)
// @route   GET /api/categories
// @access  Public
// ═══════════════════════════════════════════════════════════════
const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      isFeatured,
      level,
      parent,
      sortBy = "sortOrder",
      order = "asc",
    } = req.query;

    // ─── Build filter ─────────────────────────────────────────
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (level !== undefined) filter.level = Number(level);
    if (parent) filter.parent = parent === "null" ? null : parent;

    // ─── Sort ─────────────────────────────────────────────────
    const sortableFields = ["sortOrder", "name", "createdAt", "productCount", "commission"];
    const sortField = sortableFields.includes(sortBy) ? sortBy : "sortOrder";
    const sortOrder = order === "desc" ? -1 : 1;

    // ─── Pagination ───────────────────────────────────────────
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate("parent", "name slug")
        .populate("createdBy", "name email")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Category.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: categories,
    });
  } catch (error) {
    console.error("getAllCategories Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get single category by ID or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
// ═══════════════════════════════════════════════════════════════
const getCategory = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Detect if it's a MongoDB ObjectId or a slug
    const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

    const category = await Category.findOne(filter)
      .populate("parent", "name slug level")
      .populate("createdBy", "name email");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // ─── Also fetch direct children ───────────────────────────
    const children = await Category.find({
      parent: category._id,
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug icon image productCount level isActive");

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        children,
        breadcrumb: [
          ...category.ancestors.map((a) => ({ name: a.name, slug: a.slug })),
          { name: category.name, slug: category.slug },
        ],
      },
    });
  } catch (error) {
    console.error("getCategory Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get featured categories (for homepage)
// @route   GET /api/categories/featured
// @access  Public
// ═══════════════════════════════════════════════════════════════
const getFeaturedCategories = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const categories = await Category.find({
      isActive: true,
      isFeatured: true,
      level: 0, // only root level featured
    })
      .sort({ sortOrder: 1 })
      .limit(parseInt(limit))
      .select("name slug icon image productCount");

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("getFeaturedCategories Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const {
      name,
      description,
      commission,
      icon,
      sortOrder,
      isFeatured,
      isActive,
      metaTitle,
      metaDescription,
      parent,
    } = req.body;

    const parsedParent = parent === "" || parent === "null" ? null : parent;

    // ─── Handle parent change ─────────────────────────────────
    if (parsedParent !== undefined && parsedParent?.toString() !== category.parent?.toString()) {
      // Prevent circular reference (can't set descendant as parent)
      if (parsedParent) {
        const descendantIds = await getAllDescendantIds(category._id);
        const isCircular = descendantIds
          .map((id) => id.toString())
          .includes(parent.toString());

        if (isCircular) {
          return res.status(400).json({
            success: false,
            message: "Cannot set a descendant as parent. Circular reference detected.",
          });
        }

        const newParent = await Category.findById(parent);
        if (!newParent) {
          return res.status(404).json({
            success: false,
            message: "New parent category not found.",
          });
        }

        category.parent = newParent._id;
        category.level = newParent.level + 1;
        category.ancestors = [
          ...newParent.ancestors,
          { _id: newParent._id, name: newParent.name, slug: newParent.slug },
        ];
      } else {
        // Moving to root
        category.parent = null;
        category.level = 0;
        category.ancestors = [];
      }
    }

    // ─── Apply updates ────────────────────────────────────────
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (commission !== undefined) category.commission = Number(commission);
    if (icon !== undefined) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isFeatured !== undefined) category.isFeatured = isFeatured === "true" || isFeatured === true;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined) category.metaDescription = metaDescription;
    if (isActive !== undefined) category.isActive = isActive === "true" || isActive === true;

    if (req.file) {

        // delete old image
        if (category.image?.publicId) {
            await cloudinary.uploader.destroy(category.image.publicId);
        }

        const imgUrl = await uploadImage(req.file.path);

        category.image = {
            url: imgUrl.secure_url,
            publicId: imgUrl.public_id,
        };
        }

    // ─── Handle deactivation cascade ─────────────────────────
    if (isActive === false && category.isActive === true) {
      // Deactivate all children too
      const descendantIds = await getAllDescendantIds(category._id);
      if (descendantIds.length > 0) {
        await Category.updateMany(
          { _id: { $in: descendantIds } },
          { $set: { isActive: false } }
        );
      }
      category.isActive = false;
    } else if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: category,
    });
  } catch (error) {
    console.error("updateCategory Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Delete category (only if no children & no products)
// @route   DELETE /api/categories/:id
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const deleteCategory = async (req, res) => {
  try {
    const { force } = req.query; // ?force=true deletes with children

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // ─── Check for children ───────────────────────────────────
    const childCount = await Category.countDocuments({ parent: req.params.id });

    if (childCount > 0 && force !== "true") {
      return res.status(400).json({
        success: false,
        message: `This category has ${childCount} subcategories. Use ?force=true to delete all, or remove subcategories first.`,
        childCount,
      });
    }

    // ─── Check for products (you'll add Product model later) ──
    // const productCount = await Product.countDocuments({ category: req.params.id });
    // if (productCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete. ${productCount} products are in this category.`,
    //   });
    // }

    if (force === "true") {
      // Delete all descendants recursively
      const descendantIds = await getAllDescendantIds(category._id);
      if (descendantIds.length > 0) {
        await Category.deleteMany({ _id: { $in: descendantIds } });
      }
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: force === "true"
        ? "Category and all subcategories deleted."
        : "Category deleted successfully.",
    });
  } catch (error) {
    console.error("deleteCategory Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Bulk update sort order (drag & drop reorder)
// @route   PUT /api/categories/reorder
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const reorderCategories = async (req, res) => {
  try {
    const { items } = req.body;
    // items: [{ id: "...", sortOrder: 0 }, { id: "...", sortOrder: 1 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items array is required.",
      });
    }

    const bulkOps = items.map(({ id, sortOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder } },
      },
    }));

    await Category.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Categories reordered successfully.",
    });
  } catch (error) {
    console.error("reorderCategories Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Toggle category active status
// @route   PATCH /api/categories/:id/toggle
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const newStatus = !category.isActive;
    category.isActive = newStatus;

    // If deactivating, cascade to children
    if (!newStatus) {
      const descendantIds = await getAllDescendantIds(category._id);
      if (descendantIds.length > 0) {
        await Category.updateMany(
          { _id: { $in: descendantIds } },
          { $set: { isActive: false } }
        );
      }
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${newStatus ? "activated" : "deactivated"} successfully.`,
      data: { isActive: newStatus },
    });
  } catch (error) {
    console.error("toggleCategoryStatus Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Update product count (called internally after product CRUD)
// @route   PATCH /api/categories/:id/product-count
// @access  Private — System / Admin
// ═══════════════════════════════════════════════════════════════
const updateProductCount = async (categoryId, increment = 1) => {
  try {
    await Category.findByIdAndUpdate(categoryId, {
      $inc: { productCount: increment },
    });
  } catch (error) {
    console.error("updateProductCount Error:", error);
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get category stats for admin dashboard
// @route   GET /api/categories/stats
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const getCategoryStats = async (req, res) => {
  try {
    const [stats] = await Category.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactive: { $sum: { $cond: ["$isActive", 0, 1] } },
          featured: { $sum: { $cond: ["$isFeatured", 1, 0] } },
          rootLevel: { $sum: { $cond: [{ $eq: ["$level", 0] }, 1, 0] } },
          totalProducts: { $sum: "$productCount" },
          avgCommission: { $avg: "$commission" },
        },
      },
    ]);

    // Top categories by product count
    const topCategories = await Category.find({ isActive: true })
      .sort({ productCount: -1 })
      .limit(5)
      .select("name slug productCount level icon");

    res.status(200).json({
      success: true,
      data: {
        overview: stats || {
          total: 0,
          active: 0,
          inactive: 0,
          featured: 0,
          rootLevel: 0,
          totalProducts: 0,
          avgCommission: 0,
        },
        topCategories,
      },
    });
  } catch (error) {
    console.error("getCategoryStats Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createCategory,
  getCategoryTree,
  getAllCategories,
  getCategory,
  getFeaturedCategories,
  updateCategory,
  deleteCategory,
  reorderCategories,
  toggleCategoryStatus,
  updateProductCount,
  getCategoryStats,
};