const mongoose = require("mongoose");
const slugify = require("slugify");

// ─── Review Sub-Schema ────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      maxlength: [500, "Comment max 500 characters"],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Variant Sub-Schema (Size, Color etc.) ────────────────────
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },   // e.g. "Color", "Size"
  options: [
    {
      label: { type: String, required: true }, // e.g. "Red", "XL"
      price: { type: Number, default: 0 },     // extra price for this option
      stock: { type: Number, default: 0 },
      sku: { type: String, default: "" },
    },
  ],
});

// ─── Main Product Schema ──────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name max 200 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [5000, "Description max 5000 characters"],
    },

    shortDescription: {
      type: String,
      maxlength: [300, "Short description max 300 characters"],
      default: "",
    },

    // ── Media ───────────────────────────────────────────────
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" }, // Cloudinary
        isMain: { type: Boolean, default: false },
      },
    ],

    // ── Pricing ─────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (val) {
          // discountPrice must be less than price
          return val === 0 || val < this.price;
        },
        message: "Discount price must be less than original price",
      },
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Stock ────────────────────────────────────────────────
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5, // alert when stock <= this
    },

    sku: {
      type: String,
      unique: true,
      sparse: true, // allow multiple nulls
      trim: true,
    },

    // ── Variants ─────────────────────────────────────────────
    hasVariants: {
      type: Boolean,
      default: false,
    },

    variants: [variantSchema],

    // ── Category & Tags ──────────────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // ── Vendor Info ──────────────────────────────────────────
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor is required"],
    },

    // ── Commission (copied from category at creation time) ───
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },

    // ── Shipping ─────────────────────────────────────────────
    shipping: {
      weight: { type: Number, default: 0 },     // kg
      dimensions: {
        length: { type: Number, default: 0 },   // cm
        width:  { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
      isFreeShipping: { type: Boolean, default: false },
      shippingCost:   { type: Number, default: 0 },
    },

    // ── Status ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "pending", "active", "rejected", "archived"],
      default: "pending",
      // draft   → vendor saves but not submitted
      // pending → submitted, waiting admin approval
      // active  → approved, visible to customers
      // rejected → admin rejected with reason
      // archived → vendor/admin archived (hidden but not deleted)
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // ── SEO ──────────────────────────────────────────────────
    metaTitle:       { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    // ── Reviews & Ratings (denormalized for performance) ─────
    reviews: [reviewSchema],

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
      // breakdown: how many 1★, 2★ ... 5★
      breakdown: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },

    // ── Stats ────────────────────────────────────────────────
    salesCount:  { type: Number, default: 0 },
    viewCount:   { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ════════════════════════════════════════════════════════
// VIRTUAL: effectivePrice (discountPrice থাকলে সেটা, না হলে price)
// ════════════════════════════════════════════════════════
productSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// ════════════════════════════════════════════════════════
// VIRTUAL: isLowStock
// ════════════════════════════════════════════════════════
productSchema.virtual("isLowStock").get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// ════════════════════════════════════════════════════════
// VIRTUAL: isOutOfStock
// ════════════════════════════════════════════════════════
productSchema.virtual("isOutOfStock").get(function () {
  return this.stock === 0;
});

// ════════════════════════════════════════════════════════
// PRE-SAVE: Auto slug + discountPercent calculation
// ════════════════════════════════════════════════════════
productSchema.pre("save", async function () {
  // Clean up SKU if empty or whitespace-only
  if (this.sku !== undefined) {
    if (typeof this.sku === "string" && this.sku.trim() === "") {
      this.sku = undefined;
    } else if (typeof this.sku === "string") {
      this.sku = this.sku.trim();
    }
  }

  // Auto slug
  if (this.isModified("name")) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (
      await mongoose.model("Product").exists({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }

  // Auto discountPercent
  if (this.discountPrice > 0 && this.price > 0) {
    this.discountPercent = Math.round(
      ((this.price - this.discountPrice) / this.price) * 100
    );
  } else {
    this.discountPercent = 0;
  }

  
});

// ════════════════════════════════════════════════════════
// METHOD: Recalculate ratings after review add/remove
// ════════════════════════════════════════════════════════
productSchema.methods.recalculateRatings = function () {
  const reviews = this.reviews;
  if (reviews.length === 0) {
    this.ratings = { average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    return;
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;

  reviews.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    total += r.rating;
  });

  this.ratings = {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    breakdown,
  };
};

// ════════════════════════════════════════════════════════
// INDEXES
// ════════════════════════════════════════════════════════
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ "ratings.average": -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" }); // full-text

module.exports = mongoose.model("Product", productSchema);