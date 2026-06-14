"use client";
import { useState, useEffect } from "react";
import { orderAPI, productAPI } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { StatCard, Card, OrderStatusBadge, ProductStatusBadge } from "@/components/ui";
import Link from "next/link";

export default function VendorDashboard() {
  const { user }  = useAuth();
  const [oStats,  setOStats]  = useState(null);
  const [pStats,  setPStats]  = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderAPI.getVendorOrders({ page: 1, limit: 5 }),
      productAPI.getMyProducts({ page: 1, limit: 5, status: "pending" }),
      productAPI.getMyProducts({ page: 1, limit: 100 }),
    ]).then(([ord, pend, allP]) => {
      setRecent(ord.data.data);
      setPending(pend.data.data);
      setPStats(allP.data.summary);

      // Calculate order stats from recent orders
      const summary = { totalOrders: ord.data.total, totalRevenue: 0, pending: 0, delivered: 0 };
      ord.data.data.forEach((o) => {
        const myItems = o.items || [];
        myItems.forEach((i) => { summary.totalRevenue += i.vendorEarning || 0; });
        if (o.status === "pending")   summary.pending++;
        if (o.status === "delivered") summary.delivered++;
      });
      setOStats(summary);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n?.toLocaleString("en-BD") ?? "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue"   value={`৳${fmt(user?.vendorInfo?.totalRevenue)}`} color="green"  loading={loading} icon={() => <span className="text-lg">💰</span>} />
        <StatCard title="Total Orders"    value={fmt(oStats?.totalOrders)}                   color="blue"   loading={loading} icon={() => <span className="text-lg">🛒</span>} />
        <StatCard title="Active Products" value={fmt(pStats?.active)}                        color="teal"   loading={loading} icon={() => <span className="text-lg">📦</span>} />
        <StatCard title="Pending Review"  value={fmt(pStats?.pending)}                       color="amber"  loading={loading} icon={() => <span className="text-lg">⏳</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/vendor/orders" className="text-xs text-teal-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex justify-between">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))
            ) : recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</p>
            ) : recent.map((o) => (
              <Link key={o._id} href={`/vendor/orders/${o._id}`}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                <div>
                  <p className="text-sm font-mono font-semibold text-teal-700">{o.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={o.status} />
                  <p className="text-xs text-gray-500 mt-0.5">
                    ৳{o.items?.reduce((s, i) => s + i.vendorEarning, 0)?.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Pending Products */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Pending Approval</h2>
            <Link href="/vendor/products" className="text-xs text-teal-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex justify-between">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))
            ) : pending.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No pending products</p>
            ) : pending.map((p) => (
              <Link key={p._id} href={`/vendor/products/edit/${p._id}`}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{p.name}</p>
                <ProductStatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add Product",  href: "/vendor/add_product",  icon: "➕", color: "bg-teal-50 text-teal-700 border-teal-100" },
          { label: "My Products",  href: "/vendor/products",       icon: "📦", color: "bg-blue-50 text-blue-700 border-blue-100"  },
          { label: "My Orders",    href: "/vendor/orders",         icon: "🛒", color: "bg-purple-50 text-purple-700 border-purple-100" },
          { label: "Shop Profile", href: "/vendor/profile",        icon: "🏪", color: "bg-amber-50 text-amber-700 border-amber-100" },
        ].map((q) => (
          <Link key={q.href} href={q.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border font-medium text-sm transition hover:shadow-sm ${q.color}`}>
            <span className="text-2xl">{q.icon}</span>
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}