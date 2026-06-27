"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useGetCategoryTreeQuery } from "@/redux/slices/categoriesApi";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui";
import { ChevronRight } from "lucide-react";

export default function MegaMenu({ isOpen, onClose }) {
  const { data: treeRes, isLoading } = useGetCategoryTreeQuery();
  const [activeRoot, setActiveRoot] = useState(null);

  const categories = treeRes?.data || [];

  // Set first category active by default if not set
  React.useEffect(() => {
    if (categories.length > 0 && !activeRoot) {
      setActiveRoot(categories[0]);
    }
  }, [categories, activeRoot]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl z-50 overflow-hidden"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto flex h-[420px]">
        {/* Left Side: Root Categories */}
        <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="sm" color="blue" />
            </div>
          ) : categories.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No categories</p>
          ) : (
            categories.map((cat) => (
              <button
                key={cat._id}
                onMouseEnter={() => setActiveRoot(cat)}
                className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center justify-between transition-colors ${
                  activeRoot?._id === cat._id
                    ? "bg-white dark:bg-slate-900 text-orange-500 dark:text-orange-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  {cat.image?.url ? (
                    <img src={cat.image.url} alt="" className="w-5 h-5 object-cover rounded" />
                  ) : cat.icon ? (
                    <span className="text-base">{cat.icon}</span>
                  ) : null}
                  {cat.name}
                </span>
                {cat.children?.length > 0 && <ChevronRight className="w-4 h-4 opacity-70" />}
              </button>
            ))
          )}
        </div>

        {/* Right Side: Children (Sub-categories) */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
          {activeRoot ? (
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-slate-50 dark:border-slate-800/40 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">
                  All {activeRoot.name}
                </h3>
                <Link
                  href={`/products?category=${activeRoot.slug}`}
                  onClick={onClose}
                  className="text-xs text-orange-500 dark:text-orange-400 font-semibold hover:underline"
                >
                  View All Products →
                </Link>
              </div>

              {activeRoot.children?.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {activeRoot.children.map((sub) => (
                    <div key={sub._id} className="space-y-2.5">
                      <Link
                        href={`/products?category=${sub.slug}`}
                        onClick={onClose}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-orange-500 dark:hover:text-orange-400 text-sm block transition-colors"
                      >
                        {sub.name}
                      </Link>

                      {sub.children?.length > 0 && (
                        <ul className="space-y-1.5 border-l border-slate-100 dark:border-slate-800 pl-3">
                          {sub.children.map((child) => (
                            <li key={child._id}>
                              <Link
                                href={`/products?category=${child.slug}`}
                                onClick={onClose}
                                className="text-xs text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors block py-0.5"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No sub-categories</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Hover over a category on the left to browse items
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
