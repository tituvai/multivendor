"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectRecentlyViewed } from "@/redux/slices/cartSlice";
import { useGetFeaturedCategoriesQuery } from "@/redux/slices/categoriesApi";
import { useGetProductsQuery } from "@/redux/slices/productsApi";
import { flashSaleAPI, bannerAPI } from "@/services/api";
import ProductCard from "@/components/customer/ProductCard";
import { Spinner, SectionHeader, ProductGrid } from "@/components/ui";
import { Flame, ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  const recentlyViewed = useSelector(selectRecentlyViewed);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const { data: featuredCatsRes, isLoading: catsLoading } = useGetFeaturedCategoriesQuery();
  const { data: featuredProductsRes, isLoading: productsLoading } = useGetProductsQuery({
    limit: 15,
    sortBy: "createdAt",
    order: "desc",
  });

  const featuredCats = featuredCatsRes?.data || [];
  const featuredProducts = featuredProductsRes?.data || [];

  // Flash Sale State
  const [flashSale, setFlashSale] = useState(null);
  const [flashLoading, setFlashLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [showAllFlash, setShowAllFlash] = useState(false);

  // Fetch active flash sale
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await flashSaleAPI.getActive();
        setFlashSale(res.data.data);
      } catch (error) {
        console.log("No active flash sale");
      } finally {
        setFlashLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (!flashSale || flashSale.status !== "active") return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const endTime = new Date(flashSale.endTime);
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        // Flash sale expired, refresh
        flashSaleAPI.getActive().then(res => {
          if (res.data.data) setFlashSale(res.data.data);
          else setFlashSale(null);
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  const flashProducts = flashSale?.items?.filter(item => item.isActive).map(item => ({
    ...item.product,
    discountPrice: item.discountPrice,
    discountPercent: item.discountPercent,
    stockLimit: item.stockLimit,
    soldCount: item.soldCount,
  })) || [];

  // Dynamic Banners State
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);

  // Fetch dynamic banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await bannerAPI.getActive({ position: "hero" });
        setBanners(res.data.data);
      } catch (error) {
        console.log("No banners found");
        setBanners([]);
      } finally {
        setBannersLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Banner carousel auto-scroll
  useEffect(() => {
    if (banners.length === 0) return;
    const bannerInterval = setInterval(() => {
      setActiveBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(bannerInterval);
  }, [banners.length]);



  return (
    <div className="space-y-12">
      {/* 1. Hero / Banner Section */}
      {bannersLoading ? (
        <div className="relative rounded-3xl overflow-hidden h-[340px] sm:h-[420px] bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : banners.length === 0 ? (
        <div className="relative rounded-3xl overflow-hidden h-[340px] sm:h-[420px] bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <p className="text-gray-500">No banners available</p>
        </div>
      ) : (
        <Link href={`/banner/${banners[activeBanner]._id}`} className="block">
          <div className="relative rounded-3xl overflow-hidden h-[340px] sm:h-[420px] bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors cursor-pointer hover:shadow-xl">
            {banners[activeBanner].image?.url ? (
              <img
                src={banners[activeBanner].image.url}
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent" />
            )}

            {/* Carousel indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.preventDefault(); setActiveBanner(idx); }}
                    className={`w-2.5 h-2.5 rounded-full transition ${idx === activeBanner ? "bg-orange-500 w-6" : "bg-white/50"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* 2. Platform Value Props */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white dark:bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-colors">
        {[
          { icon: Truck, title: "Free Shipping", desc: "For orders above ৳5,000" },
          { icon: ShieldCheck, title: "Secure Checkout", desc: "100% encrypted checkout" },
          { icon: RefreshCw, title: "Easy Returns", desc: "7-day return policy" },
          { icon: Award, title: "Verified Sellers", desc: "100% authentic products" },
        ].map((prop, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <div className="p-2.5 bg-orange-50 dark:bg-orange-950/20 text-orange-500 dark:text-orange-400 rounded-xl">
              <prop.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{prop.title}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{prop.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Flash Sale Section */}
      {flashSale && (
        <div className="space-y-6">
          {/* Banner / Header Card */}
          {flashSale.bannerImage?.url ? (
            <div className="relative w-full h-[180px] sm:h-[240px] rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 bg-slate-950 flex items-center">
              <Image src={flashSale.bannerImage.url} alt={flashSale.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />

              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="relative z-10 p-6 sm:p-10 space-y-3 max-w-2xl text-white">
                <div className="flex items-center gap-2 bg-red-600/90 text-white font-bold text-xs uppercase px-2.5 py-1 rounded-full w-fit tracking-wide animate-pulse">
                  <Flame className="w-4 h-4 fill-current" />
                  Flash Sale
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
                  {flashSale.title}
                </h2>
                {flashSale.description && (
                  <p className="text-sm sm:text-base text-slate-200 drop-shadow-sm max-w-lg">
                    {flashSale.description}
                  </p>
                )}

                {/* Timer values inside banner */}
                {flashSale.status === "active" && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-slate-300 font-medium">Ends in:</span>
                    <div className="flex items-center gap-1.5">
                      {Object.entries(timeLeft).map(([key, val]) => (
                        <div key={key} className="flex flex-col items-center">
                          <span className="px-2.5 py-1 bg-red-600 font-bold text-sm rounded shadow-md min-w-[36px] text-center text-white">
                            {val.toString().padStart(2, "0")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-8 bg-orange-500 rounded-full block" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-6 h-6 text-red-500 fill-current animate-pulse" />
                    <span>{flashSale.title || "Flash Sales"}</span>
                  </h2>
                  {flashSale.description && (
                    <p className="text-sm text-slate-500 mt-1">{flashSale.description}</p>
                  )}
                </div>
                {/* Timer count values */}
                {flashSale.status === "active" && (
                  <div className="flex items-center gap-1.5 ml-2">
                    {Object.entries(timeLeft).map(([key, val]) => (
                      <span
                        key={key}
                        className="px-2 py-1 bg-red-500 text-white font-bold text-xs rounded shadow-sm min-w-8 text-center"
                      >
                        {val.toString().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {flashLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" color="blue" />
            </div>
          ) : flashProducts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No products in this flash sale.</p>
          ) : (
            <div className="space-y-6 relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {(showAllFlash ? flashProducts : flashProducts.slice(0, 4)).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              {flashProducts.length > 4 && (
                <div className="flex justify-center mt-2 absolute -top-16 right-0">
                  <button
                    onClick={() => setShowAllFlash(!showAllFlash)}
                    className="px-6 py-2 rounded-full border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700/50 shadow-sm transition-all"
                  >
                    {showAllFlash ? "Show Less" : "See All"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Featured Categories */}
      <div className="space-y-5">
        <SectionHeader title="Featured Categories" subtitle="Shop by top categories" />
        {catsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" color="blue" />
          </div>
        ) : featuredCats.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No categories featured.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featuredCats.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-5 text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="w-32 h-32 relative bg-slate-50 dark:bg-slate-950 rounded flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-200 overflow-hidden">
                  {cat.image?.url ? (
                    <Image src={cat.image.url} alt={cat.name} fill className=" object-cover " />
                  ) : cat.icon ? (
                    <span>{cat.icon}</span>
                  ) : (
                    "📁"
                  )}
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate w-full group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  {cat.name}
                </h4>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 5. Promotional Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white flex flex-col justify-between h-56 shadow-md relative overflow-hidden">
          <div className="space-y-2 z-10">
            <span className="text-xs font-extrabold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Earn Commissions
            </span>
            <h3 className="text-2xl font-bold max-w-xs">Become a Partner Vendor</h3>
            <p className="text-xs text-orange-100 max-w-xs leading-relaxed">
              Launch your shop, list products to thousands of shoppers, and enjoy competitive commission rates.
            </p>
          </div>
          <div className="z-10">
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-orange-600 font-bold rounded-xl text-xs hover:bg-slate-50 shadow-sm transition"
            >
              Start Selling
            </Link>
          </div>
          <span className="absolute right-0 bottom-0 text-[160px] opacity-15 translate-y-10 select-none pointer-events-none">
            🏪
          </span>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-3xl p-8 text-white flex flex-col justify-between h-56 shadow-md relative overflow-hidden">
          <div className="space-y-2 z-10">
            <span className="text-xs font-extrabold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Secure Delivery
            </span>
            <h3 className="text-2xl font-bold max-w-xs">Track Your Shipments</h3>
            <p className="text-xs text-teal-100 max-w-xs leading-relaxed">
              Real-time shipping notifications, estimated delivery dates, and easy tracking routes.
            </p>
          </div>
          <div className="z-10">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-teal-600 font-bold rounded-xl text-xs hover:bg-slate-50 shadow-sm transition"
            >
              Track Orders
            </Link>
          </div>
          <span className="absolute right-0 bottom-0 text-[160px] opacity-15 translate-y-10 select-none pointer-events-none">
            🚚
          </span>
        </div>
      </div>

      {/* 6. Featured Products Grid */}
      <div className="space-y-5">
        <SectionHeader title="Featured Products" subtitle="Top trending products on our platform" />
        {productsLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="blue" />
          </div>
        ) : featuredProducts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No products live yet.</p>
        ) : (
          <ProductGrid cols={5}>
            {featuredProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </ProductGrid>
        )}
      </div>

      {/* 7. Recently Viewed Section */}
      {mounted && recentlyViewed.length > 0 && (
        <div className="space-y-5 border-t border-slate-100 dark:border-slate-800/40 pt-8 transition-colors">
          <SectionHeader title="Recently Viewed Products" />
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
