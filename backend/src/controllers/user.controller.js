const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const { sendTokenResponse, generateAccessToken } = require("../utils/tokenUtils");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailUtils");
const { sendVendorApplicationEmail } = require("../utils/vendor.email.utiles");


const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "customer",
    });

    // Generate email verification token
    const verifyToken = user.generateEmailVerifyToken();
    await user.save();

    // Send verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    try {
      await sendVerificationEmail(user, verifyUrl);
    } catch (emailError) {
      console.error("Email send failed:", emailError.message);
      // Don't fail registration if email fails — just log it
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};


// ═══════════════════════════════════════════════════════
// @desc    Register as a vendor (account + application in one step)
// @route   POST /api/auth/register-vendor
// @access  Public
// ═══════════════════════════════════════════════════════
const registerVendor = async (req, res) => {
  try {
    const {
      name, email, password,
      shopName, shopDescription, shopAddress, shopPhone, shopEmail, nidNumber,
    } = req.body;

    // ── Required field check ───────────────────────────────────
    if (!name || !email || !password || !shopName) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and shop name are required.",
      });
    }

    // ── Duplicate email check ──────────────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Duplicate shop name check ──────────────────────────────
    const shopNameTaken = await User.findOne({
      "vendorInfo.shopName": { $regex: `^${shopName}$`, $options: "i" },
    });
    if (shopNameTaken) {
      return res.status(409).json({
        success: false,
        message: "This shop name is already taken. Please choose another.",
      });
    }

    // ── Create user (vendor KYC replaces email verification) ───
    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified: true,
      isActive: true,
    });

    // ── Save vendor application info ───────────────────────────
    user.vendorInfo = {
      shopName:        shopName.trim(),
      shopDescription: shopDescription?.trim() || "",
      shopAddress:     shopAddress?.trim()  || "",
      shopPhone:       shopPhone?.trim()    || "",
      shopEmail:       shopEmail?.trim()    || email,
      nidNumber:       nidNumber?.trim()    || "",
      status:          "pending",
      isApproved:      false,
      appliedAt:       new Date(),
    };
    user.markModified("vendorInfo");
    await user.save();

    // ── Send application confirmation email ────────────────────
    try {
      await sendVendorApplicationEmail(user);
    } catch (emailErr) {
      console.error("Vendor application email failed:", emailErr.message);
    }

    // ── Return token (auto login) ──────────────────────────────
    sendTokenResponse(
      user,
      201,
      res,
      "Vendor application submitted! We will review it within 2–3 business days."
    );
  } catch (error) {
    console.error("registerVendor Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Email verified successfully! You are now logged in.");
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password included
    const user = await User.findOne({ email }).select("+password +refreshToken");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res, "Login successful!");
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token. Please login again.",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


const logout = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ success: true, message: "Logged out successfully." });
};



const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
};



const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Email could not be sent." });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Password reset successful! You are now logged in.");
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


const resendVerification = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified.",
      });
    }

    const verifyToken = user.generateEmailVerifyToken();
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendVerificationEmail(user, verifyUrl);

    res.status(200).json({
      success: true,
      message: "Verification email resent successfully.",
    });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


// Admin route part Staart 

// ═══════════════════════════════════════════════════════
// @desc    Create new admin (by existing admin only)
// @route   POST /api/auth/create-admin
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
 
    // ─── Validation ───────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }
 
    // ─── Duplicate check ──────────────────────────────────────
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
 
    // ─── Create admin ─────────────────────────────────────────
    // Admin is created by another admin — skip email verification
    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      isEmailVerified: true, // trusted — no need to verify
      isActive: true,
    });
 
    // ─── Notify new admin via email ───────────────────────────
    try {
      const { sendEmail } = require("../utils/emailUtils");
      await sendEmail({
        to: email,
        subject: "Your Admin Account — MultiVendor",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1a1a2e;">👋 Welcome, ${name}!</h2>
            <p style="color: #4a5568;">An admin account has been created for you on <strong>MultiVendor</strong>.</p>
            <table style="width:100%; border-collapse:collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; background:#f7fafc; font-weight:600; color:#4a5568;">Email</td>
                <td style="padding: 8px; color:#2d3748;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background:#f7fafc; font-weight:600; color:#4a5568;">Password</td>
                <td style="padding: 8px; color:#2d3748;">${password}</td>
              </tr>
            </table>
            <p style="color:#e53e3e; font-size:13px;">⚠️ Please change your password immediately after first login.</p>
            <a href="${process.env.CLIENT_URL}/login" style="display:inline-block; background:#1a1a2e; color:#fff; padding: 12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Login to Dashboard →</a>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Admin welcome email failed:", emailError.message);
      // Don't fail the request — just log it
    }
 
    res.status(201).json({
      success: true,
      message: `Admin account created successfully. Credentials sent to ${email}.`,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("createAdmin Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


// gatAall Admin Part Start 

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password -refreshToken -resetPasswordToken -emailVerifyToken")
      .sort({ createdAt: -1 });
 
    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    console.error("getAllAdmins Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 15, role, search } = req.query;
    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken -resetPasswordToken -emailVerifyToken")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (error) {
    console.error("getAllUsers Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot change admin status." });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      data: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    console.error("toggleUserActive Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  register,
  registerVendor,
  verifyEmail,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  resendVerification,
  createAdmin,
  getAllAdmins,
  getAllUsers,
  toggleUserActive,
};