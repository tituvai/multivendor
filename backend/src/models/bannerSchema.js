const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    position: {
      type: String,
      enum: ["hero", "middle", "bottom"],
      default: "hero",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active banners
bannerSchema.index({ isActive: 1, position: 1, order: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
