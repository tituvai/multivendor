"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, toggleWishlist, addRecentlyViewed, selectWishlist } from "@/redux/slices/cartSlice";
import { useAddReviewMutation } from "@/redux/slices/productsApi";
import ProductCard from "@/components/customer/ProductCard";
import { StarRating, Button, Textarea, Badge } from "@/components/ui";
import { ShoppingCart, Heart, Send, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailClient({ product, related = [] }) {
  const dispatch = useDispatch();
  const wishlist = useSelector(selectWishlist);
  const isWishlisted = wishlist.some((item) => item._id === product._id);

  // Active state handlers
  const [activeImage, setActiveImage] = useState(product.images?.[0]?.url || "");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Review creation form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [addReview, { isLoading: reviewAdding }] = useAddReviewMutation();

  // Add to recently viewed on load
  useEffect(() => {
    dispatch(addRecentlyViewed(product));
  }, [product, dispatch]);

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const originalPrice = product.price;
  const hasDiscount = product.discountPrice > 0;

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity, selectedVariant: selectedVariants }));
    toast.success(`${quantity} x ${product.name} added to cart! 🛒`);
  };

  const handleWishlistToggle = () => {
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.success("Removed from wishlist");
    } else {
      toast.success("Added to wishlist! ❤️");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      return toast.error("Please add a comment");
    }
    try {
      await addReview({
        id: product._id,
        data: { rating: reviewRating, comment: reviewComment },
      }).unwrap();
      toast.success("Review submitted! Thank you.");
      setReviewComment("");
    } catch (err) {
      toast.error(err.data?.message || "Failed to submit review");
    }
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  return (
    <div className="space-y-10">
      {/* Breadcrumbs */}
      {product.breadcrumb && (
        <nav className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-orange-500 transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-orange-500 transition">Products</Link>
          {product.breadcrumb.map((b, idx) => (
            <React.Fragment key={idx}>
              <span>/</span>
              <span className={idx === product.breadcrumb.length - 1 ? "text-slate-800 dark:text-slate-205 font-bold" : ""}>
                {b.name}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main product columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Image gallery */}
        <div className="space-y-4">
          <div className="h-96 sm:h-[450px] w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center relative p-4">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="object-contain h-full w-full" />
            ) : (
              <span className="text-6xl text-slate-300">📦</span>
            )}
          </div>
          {/* Gallery thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-20 h-20 bg-white dark:bg-slate-900 border rounded-xl overflow-hidden flex-shrink-0 transition ${
                    activeImage === img.url
                      ? "border-orange-500 ring-2 ring-orange-500/20"
                      : "border-slate-150 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <img src={img.url} alt="Thumbnail" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Column */}
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 transition-colors">
          <div className="space-y-2">
            <span className="text-xs font-bold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {product.category?.name}
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-slate-400">
              Seller:{" "}
              <Link href={`/vendors/${product.vendor?._id}`} className="text-orange-500 dark:text-orange-400 font-bold hover:underline">
                {product.vendor?.vendorInfo?.shopName || "Partner Seller"}
              </Link>
            </p>
          </div>

          {/* Ratings & Sales count */}
          <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/40 pb-4">
            <div className="flex items-center gap-1">
              <StarRating rating={product.ratings?.average || 0} size="sm" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 ml-1">
                {product.ratings?.average || 0}
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {product.ratings?.count || 0} Reviews
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              {product.salesCount || 0} Sold
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              ৳{price.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-slate-400 line-through">
                  ৳{originalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                  -{product.discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock state */}
          <div>
            {isOutOfStock ? (
              <Badge variant="danger">Out of stock</Badge>
            ) : isLowStock ? (
              <Badge variant="warning">Only {product.stock} left in stock - order soon!</Badge>
            ) : (
              <Badge variant="success">In Stock ({product.stock} units)</Badge>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-sm text-slate-550 dark:text-slate-300 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Variants Selector */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-50 dark:border-slate-800/40">
              {product.variants.map((v) => (
                <div key={v._id} className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{v.name}</label>
                  <div className="flex gap-2">
                    {v.options?.map((opt) => (
                      <button
                        key={opt._id}
                        onClick={() => setSelectedVariants({ ...selectedVariants, [v.name]: opt.label })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                          selectedVariants[v.name] === opt.label
                            ? "border-orange-500 bg-orange-50/10 text-orange-500"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800/40">
            {/* Quantity adjust */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 px-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300"
                disabled={isOutOfStock}
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300"
                disabled={isOutOfStock || quantity >= product.stock}
              >
                +
              </button>
            </div>

            {/* Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 py-3 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            {/* Wishlist Icon Button */}
            <button
              onClick={handleWishlistToggle}
              className={`p-3 rounded-xl border flex items-center justify-center cursor-pointer transition ${
                isWishlisted
                  ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-950/20"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500"
              }`}
            >
              <Heart className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Accordions: Description, Specifications, Reviews */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 transition-colors space-y-6">
        <div className="flex gap-4 border-b border-slate-50 dark:border-slate-800/40 pb-2">
          {["description", "specifications", "reviews"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2 text-sm font-bold capitalize transition-colors relative ${
                activeTab === t
                  ? "text-orange-500"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t}
              {activeTab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "description" && (
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          )}

          {activeTab === "specifications" && (
            <div className="max-w-md divide-y divide-slate-50 dark:divide-slate-800/40 text-sm">
              {product.shipping?.weight !== undefined && (
                <div className="grid grid-cols-2 py-2.5">
                  <span className="font-semibold text-slate-400">Weight</span>
                  <span className="text-slate-800 dark:text-slate-200">{product.shipping.weight} kg</span>
                </div>
              )}
              {product.shipping?.dimensions && (
                <div className="grid grid-cols-2 py-2.5">
                  <span className="font-semibold text-slate-400">Dimensions</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {product.shipping.dimensions.length} x {product.shipping.dimensions.width} x {product.shipping.dimensions.height} cm
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 py-2.5">
                <span className="font-semibold text-slate-400">Free Shipping</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {product.shipping?.isFreeShipping ? "Yes" : "No"}
                </span>
              </div>
              {product.sku && (
                <div className="grid grid-cols-2 py-2.5">
                  <span className="font-semibold text-slate-400">SKU</span>
                  <span className="font-mono text-slate-805 dark:text-slate-200">{product.sku}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              {/* Ratings Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl transition-colors">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {product.ratings?.average || 0}
                  </p>
                  <div className="flex justify-center mt-1">
                    <StarRating rating={product.ratings?.average || 0} size="lg" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Based on {product.ratings?.count || 0} ratings
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2 text-xs font-semibold text-slate-550 dark:text-slate-400">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = product.ratings?.breakdown?.[stars] || 0;
                    const percent =
                      product.ratings?.count > 0 ? (count / product.ratings.count) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="w-3 text-right">{stars}★</span>
                        <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-400 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-slate-400">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Reviews ({product.reviews?.length || 0})
                </h3>
                {product.reviews?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No reviews yet for this product.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {product.reviews.map((rev) => (
                      <div key={rev._id} className="py-4.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-850 flex items-center justify-center font-bold text-xs text-slate-500">
                              {rev.user?.avatar ? (
                                <img src={rev.user.avatar} className="w-full h-full object-cover" />
                              ) : (
                                rev.name?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {rev.name}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <StarRating rating={rev.rating} size="sm" />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed pl-10.5">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave a review Form */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-6">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
                  Write a Customer Review
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          onClick={() => setReviewRating(stars)}
                          className="text-2xl text-yellow-400 transition transform hover:scale-110 cursor-pointer"
                        >
                          {stars <= reviewRating ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Comment"
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about product specs, packaging, delivery..."
                  />

                  <Button type="submit" variant="primary" loading={reviewAdding}>
                    <Send className="w-4 h-4" />
                    Submit Review
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Products Grid */}
      {related.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
