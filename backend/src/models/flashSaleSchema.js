const mongoose = require("mongoose");

const flashSaleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  discountPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  stockLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: true });

const flashSaleSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Flash sale title is required"],
      trim: true,
      maxlength: [200, "Title max 200 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description max 500 characters"],
      default: "",
    },
    bannerImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // ── Timing ───────────────────────────────────────────────
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "expired", "cancelled"],
      default: "scheduled",
    },

    // ── Products ────────────────────────────────────────────
    items: [flashSaleItemSchema],

    // ── Stats ───────────────────────────────────────────────
    totalViews: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },

    // ── Admin Info ─────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Time Remaining ───────────────────────────────
flashSaleSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  if (this.status !== "active") return 0;
  const remaining = this.endTime - now;
  return Math.max(0, remaining);
});

// ─── Virtual: Total Items ──────────────────────────────────
flashSaleSchema.virtual("totalItems").get(function () {
  return this.items.length;
});

// ─── Virtual: Active Items ──────────────────────────────────
flashSaleSchema.virtual("activeItems").get(function () {
  return this.items.filter((item) => item.isActive).length;
});

// ─── Indexes ───────────────────────────────────────────────
flashSaleSchema.index({ startTime: 1, endTime: 1 });
flashSaleSchema.index({ status: 1 });
flashSaleSchema.index({ isActive: 1 });

// ─── Pre-save: Auto update status based on time ─────────────
flashSaleSchema.pre("save", function () {
  const now = new Date();
  
  if (this.isActive) {
    if (now < this.startTime) {
      this.status = "scheduled";
    } else if (now >= this.startTime && now < this.endTime) {
      this.status = "active";
    } else {
      this.status = "expired";
    }
  } else {
    this.status = "cancelled";
  }
});

module.exports = mongoose.model("FlashSale", flashSaleSchema);
