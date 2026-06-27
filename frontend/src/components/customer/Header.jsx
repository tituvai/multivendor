"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/common/ThemeProvider";
import { selectCartItemsCount, selectWishlist } from "@/redux/slices/cartSlice";
import { useGetProductsQuery } from "@/redux/slices/productsApi";
import MegaMenu from "./MegaMenu";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const cartCount = useSelector(selectCartItemsCount);
  const wishlist = useSelector(selectWishlist);
  const wishlistCount = wishlist.length;

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  const searchRef = useRef(null);
  const userRef = useRef(null);

  // Suggestions search query (debounced/triggered on text input)
  const { data: suggestionsData } = useGetProductsQuery(
    { search: searchQuery, limit: 5 },
    { skip: searchQuery.trim().length < 2 }
  );
  const suggestions = suggestionsData?.data || [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (slug) => {
    router.push(`/products/${slug}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        {/* Top bar (Recruitment promo or info) */}
        <div className="w-full bg-slate-900 text-white py-1.5 px-4 text-xs font-medium text-center flex justify-between items-center max-w-7xl mx-auto rounded-b-md">
          <p>Get up to 50% discount on summer sales! 🏷️</p>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/vendor/register" className="hover:text-orange-400 transition">
              Sell on MaltiVendor
            </Link>
            <span>|</span>
            <Link href="/auth/login" className="hover:text-orange-400 transition">
              Help Center
            </Link>
          </div>
        </div>

        {/* Main Nav Container */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo & Category Button */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1.5 font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
              <span className="text-orange-500">🛍️</span>
              <span>Malti<span className="text-orange-500 font-medium">Vendor</span></span>
            </Link>

            {/* Mega Menu Toggle */}
            <button
              onMouseEnter={() => setIsMegaOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <span>Categories</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMegaOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Search bar with suggestions */}
          <form
            onSubmit={handleSearchSubmit}
            ref={searchRef}
            className="relative flex-1 max-w-lg hidden md:block"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search premium products, category, or brands..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-4 pr-11 py-2.5 text-sm placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestion Dropdown */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden z-50 transition-colors">
                {suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    No suggestions for "{searchQuery}"
                  </p>
                ) : (
                  <div className="py-1">
                    {suggestions.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSuggestionClick(p.slug)}
                        className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 cursor-pointer transition-colors"
                      >
                        <div className="w-9 h-9 relative rounded bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <img
                              src={p.images[0].url}
                              alt={p.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full text-slate-400 text-xs">
                              📦
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            by {p.vendor?.vendorInfo?.shopName || "Partner Vendor"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            ৳
                            {(p.discountPrice > 0 ? p.discountPrice : p.price).toLocaleString()}
                          </p>
                          {p.discountPrice > 0 && (
                            <p className="text-[10px] text-slate-400 line-through">
                              ৳{p.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-slate-50 dark:border-slate-800/40 px-4 py-2">
                      <button
                        type="submit"
                        className="text-xs text-orange-500 dark:text-orange-400 font-bold hover:underline w-full text-left"
                      >
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Action Icons: Theme, Wishlist, Cart, User */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative hidden sm:block"
            >
              <Heart className="w-5 h-5" />
              {mounted && wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-slate-900">
                {wishlistCount}
              </span>
            )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-slate-900">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Auth Actions */}
            <div className="relative" ref={userRef}>
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-1 p-1 pr-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-500">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 transition-colors">
                      <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800/40 mb-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>

                      {user.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                          <span>Admin Portal</span>
                        </Link>
                      )}

                      {user.role === "vendor" && (
                        <Link
                          href="/vendor/dashboard"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 transition"
                        >
                          <ShoppingBag className="w-4 h-4 text-teal-500" />
                          <span>Vendor Panel</span>
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 transition"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>My Account</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all block"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mega Menu Container */}
        <MegaMenu isOpen={isMegaOpen} onClose={() => setIsMegaOpen(false)} />
      </header>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-16 px-4 flex flex-col gap-4 overflow-y-auto transition-colors">
          <form onSubmit={handleSearchSubmit} className="relative mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-4 pr-11 py-3 text-sm placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-slate-500"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <nav className="flex flex-col gap-3 font-semibold text-slate-700 dark:text-slate-200 mt-2 text-base">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 border-b border-slate-50 dark:border-slate-800/40"
            >
              Browse Products
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 border-b border-slate-50 dark:border-slate-800/40 flex justify-between items-center"
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/vendor/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 border-b border-slate-50 dark:border-slate-800/40"
            >
              Vendor Store Recruitment
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
