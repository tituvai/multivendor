const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, 
    },

    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },

    avatar: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    //  Email Verification 
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyToken: String,
    emailVerifyExpire: Date,

    // ________ Password Reset _______________
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ─── Refresh Token ────────────────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },

    // ─── Vendor Specific ─────────────────────────────────────
    vendorInfo: {
      shopName: { type: String, default: "" },
      shopDescription: { type: String, default: "" },
      shopAddress: { type: String, default: "" },
      shopPhone: { type: String, default: "" },
      shopEmail: { type: String, default: "" },
      shopBanner: { type: String, default: "" },
      nidNumber: { type: String, default: "" },
      nidImage: { type: String, default: "" },
      tradeLicense: { type: String, default: "" },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended", "none"],
        default: "none",
      },
      isApproved: { type: Boolean, default: false },
      appliedAt: Date,
      approvedAt: Date,
      rejectedAt: Date,
      suspendedAt: Date,
      rejectionReason: { type: String, default: "" },
      suspendReason: { type: String, default: "" },
      adminNote: { type: String, default: "" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      totalRevenue: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
    },

    // ─── Account Status ───────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,
  },
  {
    timestamps: true, 
  }
);


// MIDDLEWARE: Hash password before save

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
});


// METHOD: Compare entered password

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// METHOD: Generate email verify token

userSchema.methods.generateEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token; 
};


// METHOD: Generate password reset token

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return token;
};

module.exports = mongoose.model("User", userSchema);