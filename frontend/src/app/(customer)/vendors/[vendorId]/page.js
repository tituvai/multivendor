"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGetPublicVendorShopQuery } from "@/redux/slices/vendorsApi";
import ProductCard from "@/components/customer/ProductCard";
import { Spinner, Card, StarRating, Pagination } from "@/components/ui";
import { Calendar, ShoppingBag, MapPin, Mail, Phone, Award } from "lucide-react";

export default function PublicVendorShopPage() {
  const { vendorId } = useParams();
  const [page, setPage] = useState(1);

  // RTK query
  const { data: shopRes, isLoading } = useGetPublicVendorShopQuery(vendorId);

  const shopData = shopRes?.data;
  const vendor = shopData?.vendor;
  const products = shopData?.products || [];
  const total = shopData?.total || 0;
  const pages = shopData?.pages || 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-36">
        <Spinner size="lg" color="blue" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-24 bg-white dark:bg-slate-900 border rounded-2xl p-6">
        <span className="text-5xl block mb-3">🏪</span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shop Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">This vendor store might be inactive or suspended.</p>
      </div>
    );
  }

  const shopInfo = vendor.vendorInfo || {};
  const bannerUrl = shopInfo.shopBanner || "";

  return (
    <div className="space-y-8">
      {/* Shop Banner Panel */}
      <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden bg-slate-900 text-white flex items-end">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Shop Banner" className="object-cover w-full h-full absolute inset-0 opacity-40" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 opacity-75" />
        )}

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between w-full">
          <div className="flex items-center gap-4.5">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center text-3xl overflow-hidden border border-white/20 shrink-0">
              {vendor.avatar ? (
                <img src={vendor.avatar} alt={shopInfo.shopName} className="object-cover w-full h-full" />
              ) : (
                "🏪"
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                <span>{shopInfo.shopName}</span>
                <Award className="w-5.5 h-5.5 text-yellow-400 fill-current shrink-0" />
              </h1>
              <p className="text-xs text-orange-100 mt-1 leading-normal max-w-xl line-clamp-2">
                {shopInfo.shopDescription || "Quality verified products directly from our premium partner seller."}
              </p>
            </div>
          </div>

          {/* Core metrics badges */}
          <div className="flex gap-4 shrink-0 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <div>
              <p className="text-lg font-bold text-white">৳{(shopInfo.totalSales || 0).toLocaleString()}</p>
              <p className="text-[10px] text-orange-200 font-semibold uppercase tracking-wider mt-0.5">Revenue</p>
            </div>
            <span className="w-px h-8 bg-white/20" />
            <div>
              <div className="flex items-center gap-1 justify-center">
                <span className="text-sm font-bold text-white">{shopInfo.rating || 5}</span>
                <span className="text-yellow-400 text-xs">★</span>
              </div>
              <p className="text-[10px] text-orange-200 font-semibold uppercase tracking-wider mt-0.5">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing store profile specifications & product listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Vendor Stats profile */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-50 dark:border-slate-800/40">
              Seller Information
            </h3>
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Joined {new Date(vendor.createdAt).toLocaleDateString()}</span>
              </div>
              {shopInfo.shopAddress && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{shopInfo.shopAddress}</span>
                </div>
              )}
              {shopInfo.shopEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{shopInfo.shopEmail}</span>
                </div>
              )}
              {shopInfo.shopPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{shopInfo.shopPhone}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Vendor Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShoppingBag className="w-5.5 h-5.5 text-orange-500" />
              <span>Products List ({total})</span>
            </h3>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors">
              <span className="text-4xl block mb-2">📦</span>
              <p className="text-sm text-slate-400">This shop hasn't listed any active products yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors px-4">
                <Pagination page={page} pages={pages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
