"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetProductsQuery } from "@/redux/slices/productsApi";
import { useGetCategoryTreeQuery } from "@/redux/slices/categoriesApi";
import ProductCard from "@/components/customer/ProductCard";
import { Spinner, Pagination, StarRating } from "@/components/ui";
import { SlidersHorizontal, ArrowUpDown, X, ChevronRight } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "createdAt-desc" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Popularity", value: "popular-desc" },
  { label: "Customer Rating", value: "rating-desc" },
];

function ProductListingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse URL params
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialIsFeatured = searchParams.get("isFeatured") === "true";

  // Filter and pagination states
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state if URL changes (e.g. from Header search)
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setPage(1);
  }, [searchParams]);

  // Categories Tree for sidebar filter
  const { data: treeRes } = useGetCategoryTreeQuery();
  const categoriesList = treeRes?.data || [];

  // Query Products API
  const queryParams = {
    page,
    limit: 12,
    sortBy,
    order,
    ...(search && { search }),
    ...(category && { category }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    ...(rating && { rating }),
    ...(inStock && { inStock: "true" }),
    ...(initialIsFeatured && { isFeatured: "true" }),
  };

  const { data: productsRes, isLoading, isFetching } = useGetProductsQuery(queryParams);

  const products = productsRes?.data || [];
  const total = productsRes?.total || 0;
  const pages = productsRes?.pages || 1;

  const handleSortChange = (e) => {
    const [field, dir] = e.target.value.split("-");
    setSortBy(field);
    setOrder(dir);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setRating("");
    setInStock(false);
    setPage(1);
    router.push("/products");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Filters Sidebar - Desktop */}
      <aside className="w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shrink-0 hidden lg:block transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">Filters</h3>
          <button
            onClick={handleResetFilters}
            className="text-xs text-orange-500 hover:underline font-semibold"
          >
            Reset All
          </button>
        </div>

        <div className="space-y-6">
          {/* Search Sub-filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Keyword..."
              className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3.5 py-2.5 rounded-lg border border-slate-150 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Categories Sub-filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
              <button
                onClick={() => {
                  setCategory("");
                  setPage(1);
                }}
                className={`w-full text-left text-xs font-medium py-1 px-1.5 rounded transition ${
                  category === ""
                    ? "bg-orange-500 text-white"
                    : "text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                All Categories
              </button>
              {categoriesList.map((cat) => (
                <div key={cat._id} className="space-y-1">
                  <button
                    onClick={() => {
                      setCategory(cat.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left text-xs font-semibold py-1 px-1.5 rounded flex justify-between items-center transition ${
                      category === cat.slug
                        ? "bg-orange-500 text-white"
                        : "text-slate-800 dark:text-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                  {cat.children?.map((sub) => (
                    <button
                      key={sub._id}
                      onClick={() => {
                        setCategory(sub.slug);
                        setPage(1);
                      }}
                      className={`w-full text-left text-xs py-0.5 pl-4 pr-1 rounded flex items-center gap-1 transition ${
                        category === sub.slug
                          ? "text-orange-500 font-bold"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 opacity-60" />
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Price Sub-filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Range (৳)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Min"
                className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-2.5 py-2.5 rounded-lg border border-slate-150 dark:border-slate-800 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Max"
                className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-2.5 py-2.5 rounded-lg border border-slate-150 dark:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Ratings Sub-filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Ratings</label>
            <div className="space-y-1">
              {[4, 3, 2, 1].map((stars) => (
                <button
                  key={stars}
                  onClick={() => {
                    setRating(stars);
                    setPage(1);
                  }}
                  className={`w-full text-left py-1.5 px-2 rounded flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                    rating === stars ? "bg-orange-50 dark:bg-slate-800/80 font-bold" : ""
                  }`}
                >
                  <StarRating rating={stars} size="sm" />
                  <span className="text-[10px] text-slate-500">& Up</span>
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Availability</label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-orange-500 focus:ring-orange-400"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Product Grid Area */}
      <div className="flex-1 w-full space-y-6">
        {/* Top bar controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white">{products.length}</span> of{" "}
            <span className="text-slate-900 dark:text-white">{total}</span> items
          </p>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                onChange={handleSortChange}
                className="bg-slate-50 dark:bg-slate-800 text-xs border-none rounded-xl py-2 pl-2 pr-8 font-semibold text-slate-700 dark:text-slate-200 focus:ring-orange-400 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-36">
            <Spinner size="lg" color="blue" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors">
            <span className="text-5xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-450 mt-1 max-w-xs mx-auto">
              We couldn't find matches. Try adjusting your query or resetting filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-orange-600 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-80 bg-white dark:bg-slate-900 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 transition-colors">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Filters</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Duplicate Filters structure inside mobile drawer */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="">All Categories</option>
                    {categoriesList.map((cat) => (
                      <option key={cat._id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price Range (৳)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full bg-slate-50 dark:bg-slate-950 text-xs px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ratings</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                  >
                    <option value="">All Ratings</option>
                    <option value="4">4 Stars & Up</option>
                    <option value="3">3 Stars & Up</option>
                    <option value="2">2 Stars & Up</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-36">
        <Spinner size="lg" color="blue" />
      </div>
    }>
      <ProductListingContent />
    </Suspense>
  );
}
