"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { label: "Dashboard",  href: "/admin/dashboard",   icon: "📊" },
  { label: "Users",      href: "/admin/users",        icon: "👥" },
  { label: "Vendors",    href: "/admin/vendors",      icon: "🏪" },
  { label: "Products",   href: "/admin/products",     icon: "📦" },
  { label: "Orders",     href: "/admin/orders",       icon: "🛒" },
  { label: "Categories", href: "/admin/categories",   icon: "🗂️" },
];

export default function AdminSidebar({ open, onClose }) {
  const pathname    = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay (mobile) */}
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}

      <aside className={clsx(
        "fixed top-0 left-0 h-full w-64 bg-indigo-950 text-white z-30 flex flex-col",
        "transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-indigo-900">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-bold text-white leading-tight">MultiVendor</p>
              <p className="text-xs text-indigo-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-indigo-700 text-white"
                    : "text-indigo-300 hover:bg-indigo-900 hover:text-white"
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-indigo-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-indigo-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-indigo-300 hover:bg-indigo-900 hover:text-white transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}