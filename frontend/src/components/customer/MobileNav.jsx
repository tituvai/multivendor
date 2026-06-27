"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { selectCartItemsCount, selectWishlist } from "@/redux/slices/cartSlice";
import { useAuth } from "@/hooks/useAuth";
import { Home, Search, ShoppingCart, Heart, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  
  const cartCount = useSelector(selectCartItemsCount);
  const wishlist = useSelector(selectWishlist);
  const wishlistCount = wishlist.length;

  const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/products", icon: Search },
    { label: "Cart", href: "/cart", icon: ShoppingCart, count: cartCount },
    { label: "Wishlist", href: "/wishlist", icon: Heart, count: wishlistCount },
    { label: "Profile", href: isLoggedIn ? "/profile" : "/auth/login", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-around z-40 px-2 transition-colors">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors relative ${
              isActive
                ? "text-orange-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            {mounted && item.count > 0 && (
              <span className="absolute top-0.5 right-1/2 translate-x-3 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold ring-1 ring-white dark:ring-slate-900">
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
