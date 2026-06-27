"use client";
import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, toggleWishlist, selectWishlist } from "@/redux/slices/cartSlice";
import { StarRating } from "@/components/ui";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const wishlist = useSelector(selectWishlist);
  const isWishlisted = wishlist.some((item) => item._id === product._id);

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const originalPrice = product.price;
  const hasDiscount = product.discountPrice > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart! 🛒`);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist! ❤️");
    }
  };

  const mainImageUrl = product.images?.[0]?.url || "";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between h-[360px] relative transition-colors"
    >
      {/* Product Image Section */}
      <div className="relative h-44 w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
        {mainImageUrl ? (
          <img
            src={mainImageUrl}
            alt={product.name}
            className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl text-slate-300">📦</span>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
            {product.discountPercent}% Off
          </span>
        )}

        {/* Action Buttons overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 hover:bg-orange-500 hover:text-white flex items-center justify-center shadow-md text-slate-700 dark:text-slate-200 transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={handleAddToCart}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 hover:bg-orange-500 hover:text-white flex items-center justify-center shadow-md text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition ${
            isWishlisted
              ? "bg-red-50 dark:bg-red-950/40 text-red-500"
              : "bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-500"
          }`}
          title="Wishlist"
        >
          <Heart className="w-4.5 h-4.5 fill-current" />
        </button>
      </div>

      {/* Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Category / Vendor */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            <span>{product.category?.name || "General"}</span>
            <span className="text-orange-500 dark:text-orange-400 truncate max-w-[90px]">
              {product.vendor?.vendorInfo?.shopName || "Partner Seller"}
            </span>
          </div>

          {/* Product Title */}
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-semibold text-slate-850 dark:text-slate-100 hover:text-orange-500 dark:hover:text-orange-400 transition-colors line-clamp-2 leading-snug block"
          >
            {product.name}
          </Link>
        </div>

        {/* Price & Rating */}
        <div className="space-y-2 mt-2">
          {/* Ratings */}
          <div className="flex items-center gap-1">
            <StarRating rating={product.ratings?.average || 0} size="sm" />
            <span className="text-[10px] text-slate-400">
              ({product.ratings?.count || 0})
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-50">
              ৳{price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                ৳{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
