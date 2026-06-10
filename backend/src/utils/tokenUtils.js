const jwt = require("jsonwebtoken");

// ────────────────────────────────────────────────
// Generate Access Token (short-lived: 15 min)
// ────────────────────────────────────────────────
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
  });
};

// ────────────────────────────────────────────────
// Generate Refresh Token (long-lived: 7 days)
// ────────────────────────────────────────────────
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// ────────────────────────────────────────────────
// Send tokens: access in body, refresh in httpOnly cookie
// ────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Cookie options
  const cookieOptions = {
    httpOnly: true,   // JS cannot access this cookie
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      vendorInfo: user.role === "vendor" ? user.vendorInfo : undefined,
    },
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendTokenResponse,
};