const User = require("../models/userSchema");
const uploadImage = require("../middlewares/cloudinary.middleware");

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const result = await uploadImage(req.file.path);
    req.user.avatar = result.secure_url || result.url;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully.",
      data: { avatar: req.user.avatar },
    });
  } catch (error) {
    console.error("uploadAvatar Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload avatar." });
  }
};

const uploadShopBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No banner file provided." });
    }

    if (req.user.role !== "vendor") {
      return res.status(403).json({ success: false, message: "Only vendors can update shop banners." });
    }

    const result = await uploadImage(req.file.path);
    req.user.vendorInfo = req.user.vendorInfo || {};
    req.user.vendorInfo.shopBanner = result.secure_url || result.url;
    req.user.markModified("vendorInfo");
    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Shop banner uploaded successfully.",
      data: { shopBanner: req.user.vendorInfo.shopBanner },
    });
  } catch (error) {
    console.error("uploadShopBanner Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload shop banner." });
  }
};

module.exports = { uploadAvatar, uploadShopBanner };