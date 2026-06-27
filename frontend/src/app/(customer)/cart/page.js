"use client";
import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCart,
  selectCartTotal,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "@/redux/slices/cartSlice";
import { Button, Card, EmptyState } from "@/components/ui";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCart);
  const cartTotal = useSelector(selectCartTotal);

  const handleQtyChange = (productId, selectedVariant, currentQty, amount) => {
    const nextQty = currentQty + amount;
    if (nextQty < 1) return;
    dispatch(updateCartQuantity({ productId, selectedVariant, quantity: nextQty }));
  };

  const handleRemove = (productId, selectedVariant) => {
    dispatch(removeFromCart({ productId, selectedVariant }));
    toast.success("Removed from cart");
  };

  const shippingCost = cartTotal > 5000 || cartTotal === 0 ? 0 : 120;
  const finalTotal = cartTotal + shippingCost;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Card className="p-8">
          <EmptyState
            icon="🛒"
            title="Your Cart is Empty"
            description="Looks like you haven't added anything to your cart yet. Explore our marketplace and find great deals!"
            action={
              <Link href="/products">
                <Button variant="primary">Start Shopping</Button>
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shopping Cart</h1>
        <p className="text-sm text-slate-500 mt-0.5">{cartItems.length} unique item(s) in cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="divide-y divide-slate-100 dark:divide-slate-800/40 p-4 transition-colors bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
            {cartItems.map((item, idx) => {
              const product = item.product;
              const price = product.discountPrice > 0 ? product.discountPrice : product.price;
              const itemTotal = price * item.quantity;
              const hasDiscount = product.discountPrice > 0;

              return (
                <div key={idx} className="py-4.5 flex gap-4 first:pt-0 last:pb-0 items-start">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-850">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-grow min-w-0 space-y-1">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-bold text-sm text-slate-850 dark:text-slate-100 hover:text-orange-500 transition-colors line-clamp-1 block"
                    >
                      {product.name}
                    </Link>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">
                      Shop: {product.vendor?.vendorInfo?.shopName || "Partner Seller"}
                    </p>

                    {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        {Object.entries(item.selectedVariant).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-slate-50 dark:bg-slate-850 text-slate-500 border border-slate-100 dark:border-slate-800 px-2 py-0.5 text-[9px] font-bold rounded"
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quantity Selector on Mobile */}
                    <div className="flex items-center gap-2 pt-2.5 sm:hidden">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                        <button
                          onClick={() => handleQtyChange(product._id, item.selectedVariant, item.quantity, -1)}
                          className="w-7 h-7 flex items-center justify-center font-bold text-slate-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-800 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQtyChange(product._id, item.selectedVariant, item.quantity, 1)}
                          className="w-7 h-7 flex items-center justify-center font-bold text-slate-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(product._id, item.selectedVariant)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity controls - Desktop */}
                  <div className="hidden sm:flex flex-col items-center gap-1.5 shrink-0">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 px-0.5">
                      <button
                        onClick={() => handleQtyChange(product._id, item.selectedVariant, item.quantity, -1)}
                        className="w-7 h-7 flex items-center justify-center font-bold text-slate-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(product._id, item.selectedVariant, item.quantity, 1)}
                        className="w-7 h-7 flex items-center justify-center font-bold text-slate-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(product._id, item.selectedVariant)}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Price info */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      ৳{itemTotal.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ৳{price.toLocaleString()} each
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>

          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <button
              onClick={() => dispatch(clearCart())}
              className="text-xs text-red-500 hover:underline font-bold"
            >
              Clear Entire Cart
            </button>
            <Link href="/products" className="text-xs text-orange-500 font-bold hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Order Summary</h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800 dark:text-slate-205">৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Fee</span>
                <span className="font-semibold text-slate-800 dark:text-slate-205">
                  {shippingCost === 0 ? "Free" : `৳${shippingCost}`}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-[10px] text-orange-500 font-bold">
                  Add ৳{Math.max(0, 5000 - cartTotal).toLocaleString()} more for FREE shipping!
                </p>
              )}

              <hr className="border-slate-100 dark:border-slate-800/40 my-3" />

              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
                <span>Total</span>
                <span>৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <Link href="/checkout" className="block pt-2">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2" size="lg">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

          {/* Secure details card */}
          <div className="flex gap-3 items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
            <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-900 dark:text-white">100% Protection Policy</p>
              <p className="text-slate-400 mt-0.5">Secure gateway transactions & authentic products.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
