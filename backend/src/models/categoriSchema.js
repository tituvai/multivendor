// models/Category.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [80, "Category name max 80 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: [500, "Description max 500 characters"],
    },

    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }, // Cloudinary id
    },

    icon: {
      type: String,
      default: "", // emoji বা icon class যেমন "🖥️" বা "fa-laptop"
    },

    // ─── Nested Category (Self Reference) ─────────────────
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null মানে এটা root/top-level category
    },

    // ancestors রাখলে deep nesting এ query fast হয়
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        name: String,
        slug: String,
      },
    ],

    level: {
      type: Number,
      default: 0, // 0=root, 1=subcategory, 2=sub-subcategory
    },

    // ─── Commission ────────────────────────────────────────
    commission: {
      type: Number,
      default: 10, // % — vendor এর প্রতি sale থেকে admin কতটুকু নেবে
      min: 0,
      max: 100,
    },

    // ─── Status & Order ────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── SEO ──────────────────────────────────────────────
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    // ─── Stats (denormalized for performance) ─────────────
    productCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: children (populate করতে হবে manually) ──────────
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

// ─── Auto-generate slug ───────────────────────────────────────
categorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
 
});

// ─── Index for fast queries ───────────────────────────────────
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ "ancestors._id": 1 });

module.exports = mongoose.model("Category", categorySchema);