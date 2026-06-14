"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { label: "Dashboard",  href: "/vendor/dashboard",  icon: "📊" },
  { label: "Products",   href: "/vendor/products",   icon: "📦" },
  { label: "Add Product",href: "/vendor/add_product",icon: "➕" },
  { label: "Orders",     href: "/vendor/orders",     icon: "🛒" },
  { label: "Analytics",  href: "/vendor/analytics",  icon: "📈" },
  { label: "Profile",    href: "/vendor/profile",    icon: "🏪" },
];

export default function VendorSidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside className={clsx(
        "fixed top-0 left-0 h-full w-64 bg-teal-900 text-white z-30 flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-teal-800">
          <Link href="/vendor/dashboard" className="flex items-center gap-2.5">
            <span className="text-2xl">🏪</span>
            <div>
              <p className="font-bold text-white leading-tight truncate max-w-[140px]">
                {user?.vendorInfo?.shopName || "My Shop"}
              </p>
              <p className="text-xs text-teal-400">Vendor Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/vendor/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-teal-700 text-white" : "text-teal-300 hover:bg-teal-800 hover:text-white"
                )}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-teal-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-700 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-teal-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-teal-300 hover:bg-teal-800 hover:text-white transition">
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}