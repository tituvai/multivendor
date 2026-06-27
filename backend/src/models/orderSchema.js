const mongoose = require("mongoose");

// ─── Single order item ────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Snapshot at time of purchase (product may change later)
  name:     { type: String, required: true },
  image:    { type: String, default: ""    },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },

  // Variant selected (if any)
  variant: {
    name:  { type: String, default: "" },
    label: { type: String, default: "" },
  },

  // Commission calculation
  commissionRate:   { type: Number, default: 10 },  // %
  commissionAmount: { type: Number, default: 0  },  // taka
  vendorEarning:    { type: Number, default: 0  },  // taka

  // Per-item status (for partial fulfillment)
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
    default: "pending",
  },

  // Vendor ships this item
  tracking: {
    carrier:     { type: String, default: "" },
    trackingNo:  { type: String, default: "" },
    shippedAt:   { type: Date },
    deliveredAt: { type: Date },
  },
});

// ─── Main Order Schema ────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // ── Order Identity ──────────────────────────────────────
    orderNumber: {
      type: String,
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Items ───────────────────────────────────────────────
    items: [orderItemSchema],

    // ── Shipping Address ────────────────────────────────────
    shippingAddress: {
      fullName:  { type: String, required: true },
      phone:     { type: String, required: true },
      address:   { type: String, required: true },
      city:      { type: String, required: true },
      district:  { type: String, required: true },
      postalCode:{ type: String, default: ""    },
      country:   { type: String, default: "Bangladesh" },
    },

    // ── Pricing Summary ─────────────────────────────────────
    pricing: {
      subtotal:       { type: Number, required: true }, // sum of items
      shippingCharge: { type: Number, default: 0     },
      discount:       { type: Number, default: 0     }, // coupon etc.
      tax:            { type: Number, default: 0     },
      total:          { type: Number, required: true }, // final
    },

    // ── Payment ─────────────────────────────────────────────
    payment: {
      method: {
        type: String,
        enum: ["sslcommerz", "stripe", "cod", "bkash"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId:  { type: String, default: "" },
      paidAt:         { type: Date               },
      refundedAt:     { type: Date               },
      refundAmount:   { type: Number, default: 0 },
    },

    // ── Order Status ────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "pending",      // placed, payment not done
        "processing",   // payment done, vendors notified
        "partially_shipped",
        "shipped",      // all items shipped
        "delivered",    // all items delivered
        "cancelled",    // customer/admin cancelled
        "refunded",     // money returned
      ],
      default: "pending",
    },

    // ── Coupon ──────────────────────────────────────────────
    coupon: {
      code:           { type: String, default: "" },
      discountAmount: { type: Number, default: 0  },
    },

    // ── Notes ───────────────────────────────────────────────
    customerNote: { type: String, default: "" },
    adminNote:    { type: String, default: "" },

    // ── Status History (timeline) ───────────────────────────
    statusHistory: [
      {
        status:    { type: String, required: true },
        note:      { type: String, default: ""    },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Cancellation ────────────────────────────────────────
    cancelledAt:     { type: Date   },
    cancellationReason: { type: String, default: "" },
    cancelledBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── COD ─────────────────────────────────────────────────
    isCOD: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ════════════════════════════════════════════════════════════
// PRE-SAVE: Auto-generate order number
// ════════════════════════════════════════════════════════════
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    // Format: MV-20240101-XXXX (MV = MultiVendor)
    const date   = new Date();
    const prefix = `MV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

    // Find last order of today
    const lastOrder = await mongoose.model("Order")
      .findOne({ orderNumber: new RegExp(`^${prefix}`) })
      .sort({ orderNumber: -1 });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop());
      seq = lastSeq + 1;
    }

    this.orderNumber = `${prefix}-${String(seq).padStart(4, "0")}`;
  }
});

// ════════════════════════════════════════════════════════════
// VIRTUAL: vendorCount — কতজন vendor এর item আছে
// ════════════════════════════════════════════════════════════
orderSchema.virtual("vendorCount").get(function () {
  const vendors = new Set(this.items.map((i) => i.vendor.toString()));
  return vendors.size;
});

// ════════════════════════════════════════════════════════════
// INDEXES
// ════════════════════════════════════════════════════════════
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "items.vendor": 1, status: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);