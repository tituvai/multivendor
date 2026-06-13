"use client";
import { useState, useEffect } from "react";
import { orderAPI, productAPI, vendorAPI } from "@/services/api";
import { StatCard, Card } from "@/components/ui";
import { OrderStatusBadge } from "@/components/ui";


export default function AdminDashboard() {
  const [stats,        setStats]        = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [vendorStats,  setVendorStats]  = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [o, p, v, ro] = await Promise.all([
          orderAPI.adminStats({ period: "month" }),
          productAPI.adminStats(),
          vendorAPI.adminStats(),
          orderAPI.adminGetAll({ page: 1, limit: 5 }),
        ]);
        setStats(o.data.data.overview);
        setProductStats(p.data.data.overview);
        setVendorStats(v.data.data.overview);
        setRecentOrders(ro.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const fmt = (n) => n?.toLocaleString("en-BD") ?? "—";

  return (
   
      <div className="space-y-6 p-10">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your marketplace</p>
      </div>

      {/* Revenue & Order stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue"   value={`৳${fmt(stats?.totalRevenue)}`}  color="green"  loading={loading} icon={() => <span className="text-lg">💰</span>} />
        <StatCard title="Total Orders"    value={fmt(stats?.totalOrders)}          color="blue"   loading={loading} icon={() => <span className="text-lg">🛒</span>} />
        <StatCard title="Pending Orders"  value={fmt(stats?.pending)}              color="amber"  loading={loading} icon={() => <span className="text-lg">⏳</span>} />
        <StatCard title="Delivered"       value={fmt(stats?.delivered)}            color="teal"   loading={loading} icon={() => <span className="text-lg">✅</span>} />
      </div>

      {/* Product & Vendor stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products"   value={fmt(productStats?.total)}    color="purple" loading={loading} icon={() => <span className="text-lg">📦</span>} />
        <StatCard title="Pending Products" value={fmt(productStats?.pending)}  color="amber"  loading={loading} icon={() => <span className="text-lg">📋</span>} />
        <StatCard title="Total Vendors"    value={fmt(vendorStats?.approved)}  color="teal"   loading={loading} icon={() => <span className="text-lg">🏪</span>} />
        <StatCard title="Vendor Requests"  value={fmt(vendorStats?.pending)}   color="red"    loading={loading} icon={() => <span className="text-lg">🔔</span>} />
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <a href="/admin/orders" className="text-xs text-blue-600 hover:underline font-medium">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order #", "Customer", "Items", "Total", "Payment", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No orders yet</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">
                      <a href={`/admin/orders/${order._id}`} className="hover:underline">{order.orderNumber}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.customer?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{order.items?.length} item(s)</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">৳{order.pricing?.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.payment?.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {order.payment?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
   
    
  );
}