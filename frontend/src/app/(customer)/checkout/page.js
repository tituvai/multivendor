"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectCart, selectCartTotal, clearCart } from "@/redux/slices/cartSlice";
import { usePlaceOrderMutation } from "@/redux/slices/ordersApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Card, Input } from "@/components/ui";
import { ShieldCheck, ArrowRight, Truck, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

// Validation schema using Zod matching order placment requirements
const checkoutSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  paymentMethod: z.enum(["sslcommerz", "stripe", "cod", "bkash"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
});

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCart);
  const cartTotal = useSelector(selectCartTotal);

  const [placeOrder, { isLoading: placingOrder }] = usePlaceOrderMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "cod",
    },
  });

  const selectedPayment = watch("paymentMethod");

  const shippingCost = cartTotal > 5000 ? 0 : 120;
  const finalTotal = cartTotal + shippingCost;

  const onSubmit = async (data) => {
    if (cartItems.length === 0) {
      return toast.error("Your cart is empty");
    }

    // Map cartItems to backend expected payload format:
    // { productId, quantity, selectedVariant }
    const itemsPayload = cartItems.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
    }));

    const orderPayload = {
      items: itemsPayload,
      shippingAddress: {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        district: data.district,
      },
      paymentMethod: data.paymentMethod,
    };

    try {
      const res = await placeOrder(orderPayload).unwrap();
      
      // Notify customer
      toast.success(res.message || "Order placed successfully! 🎉");
      
      // If gateway URL is returned (for Stripe/SSLCommerz/bKash redirections)
      if (res.gatewayUrl) {
        dispatch(clearCart());
        window.location.href = res.gatewayUrl;
      } else {
        // Cash on delivery
        dispatch(clearCart());
        router.push("/profile");
      }
    } catch (err) {
      toast.error(err.data?.message || "Failed to place order. Check input values.");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h3 className="text-lg font-bold">Your cart is empty</h3>
        <p className="text-sm text-slate-500 mt-2">Cannot proceed to checkout with empty cart.</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button variant="primary">Shop Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Checkout</h1>
        <p className="text-sm text-slate-500 mt-0.5">Please provide delivery address and billing details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Shipping Form & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Details */}
          <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              <span>Shipping Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  placeholder="e.g. John Doe"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />
              </div>
              <div>
                <Input
                  label="Phone Number"
                  placeholder="e.g. 01712345678"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>
              <div>
                <Input
                  label="City"
                  placeholder="e.g. Uttara, Dhaka"
                  error={errors.city?.message}
                  {...register("city")}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Delivery Address"
                  placeholder="e.g. House 12, Road 5, Sector 11"
                  error={errors.address?.message}
                  {...register("address")}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="District"
                  placeholder="e.g. Dhaka"
                  error={errors.district?.message}
                  {...register("district")}
                />
              </div>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <span>Select Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "cod", label: "Cash On Delivery (COD)", desc: "Pay with cash at your doorstep" },
                { id: "sslcommerz", label: "SSLCommerz Pay", desc: "Pay securely via local Cards/MFS" },
                { id: "bkash", label: "bKash wallet", desc: "Pay directly using your bKash account" },
                { id: "stripe", label: "Stripe Payment", desc: "International credit/debit cards" },
              ].map((method) => {
                const checked = selectedPayment === method.id;
                return (
                  <label
                    key={method.id}
                    onClick={() => setValue("paymentMethod", method.id)}
                    className={`p-4 border rounded-2xl flex items-start gap-3 cursor-pointer transition ${
                      checked
                        ? "border-orange-500 bg-orange-50/10 dark:bg-orange-950/10"
                        : "border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <input
                      type="radio"
                      value={method.id}
                      checked={checked}
                      onChange={() => {}}
                      className="mt-1 text-orange-500 focus:ring-orange-400 border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{method.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{method.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>
            )}
          </Card>
        </div>

        {/* Right Column: Order Review Sidebar */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Order Review</h3>

            {/* Cart Items list preview */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 pr-2">
              {cartItems.map((item, idx) => {
                const product = item.product;
                const price = product.discountPrice > 0 ? product.discountPrice : product.price;
                return (
                  <div key={idx} className="py-3.5 flex gap-3 first:pt-0 last:pb-0 items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 rounded bg-cover flex-shrink-0 flex items-center justify-center border border-slate-100">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-sm">📦</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-105 shrink-0">
                      ৳{(price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <hr className="border-slate-100 dark:border-slate-800/40 my-3" />

            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal</span>
                <span className="text-slate-850 dark:text-slate-200">৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Cost</span>
                <span className="text-slate-855 dark:text-slate-200">
                  {shippingCost === 0 ? "Free" : `৳${shippingCost}`}
                </span>
              </div>

              <hr className="border-slate-100 dark:border-slate-800/40 my-2.5" />

              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Order Total</span>
                <span>৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-2 mt-4"
              size="lg"
              loading={placingOrder}
            >
              <span>Place Order</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          <div className="flex gap-2.5 items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
            <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0" />
            <div className="text-[10px] leading-normal">
              <p className="font-bold text-slate-900 dark:text-white">Buyer Protection</p>
              <p className="text-slate-400 mt-0.5">Receive item as described or request full refunds.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
