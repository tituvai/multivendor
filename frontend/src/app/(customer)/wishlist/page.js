"use client";
import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { selectWishlist, toggleWishlist, addToCart } from "@/redux/slices/cartSlice";
import { Button, Card, EmptyState, StarRating } from "@/components/ui";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector(selectWishlist);

  const handleRemove = (product) => {
    dispatch(toggleWishlist(product));
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart! 🛒`);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Card className="p-8">
          <EmptyState
            icon="❤️"
            title="Your Wishlist is Empty"
            description="Build your dream shopping list! Keep track of items you love and buy them when you are ready."
            action={
              <Link href="/products">
                <Button variant="primary">Browse Products</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Wishlist</h1>
        <p className="text-sm text-slate-500 mt-0.5">{wishlistItems.length} item(s) saved</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {wishlistItems.map((product) => {
          const price = product.discountPrice > 0 ? product.discountPrice : product.price;
          const originalPrice = product.price;
          const hasDiscount = product.discountPrice > 0;

          return (
            <Card key={product._id} className="p-3 flex flex-col justify-between h-[340px] relative hover:shadow-md transition">
              {/* Product Thumbnail */}
              <div className="h-36 w-full rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center relative">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.name} className="object-cover h-full w-full" />
                ) : (
                  <span className="text-2xl text-slate-350">📦</span>
                )}
                <button
                  onClick={() => handleRemove(product)}
                  className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-sm hover:scale-105 transition"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between pt-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    {product.category?.name}
                  </span>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-bold text-xs text-slate-800 dark:text-slate-100 hover:text-orange-500 line-clamp-2 leading-tight block"
                  >
                    {product.name}
                  </Link>
                </div>

                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-1">
                    <StarRating rating={product.ratings?.average || 0} size="sm" />
                    <span className="text-[9px] text-slate-450">({product.ratings?.count || 0})</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      ৳{price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ৳{originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
