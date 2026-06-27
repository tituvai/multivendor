const mongoose = require("mongoose");
const Product = require("../src/models/productSchema");
require("dotenv").config();

const updateFeaturedProducts = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Check total active products
    const totalActive = await Product.countDocuments({ status: "active" });
    console.log(`Total active products: ${totalActive}`);

    // Update first 5 active products to be featured
    console.log("Updating products to featured...");
    const result = await Product.updateMany(
      { status: "active", isFeatured: false },
      { isFeatured: true },
      { limit: 5 }
    );

    console.log(`Updated ${result.modifiedCount} products to featured`);

    // Get featured products
    console.log("Fetching featured products...");
    const featuredProducts = await Product.find({ isFeatured: true, status: "active" })
      .limit(5)
      .select("name isFeatured status");

    console.log("Featured products:", featuredProducts);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateFeaturedProducts();
