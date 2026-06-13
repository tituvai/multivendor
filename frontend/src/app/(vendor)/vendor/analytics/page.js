"use client";
import { useState, useEffect } from "react";
import { orderAPI, productAPI } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { StatCard, Card } from "@/components/ui";

export default function VendorAnalyticsPage() {
  const { user }    = useAuth();
  const [orders,    setOrders]    = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      orderAPI.getVendorOrders({ page: 1, limit: 100 }),
      productAPI.getMyProducts({ page: 1, limit: 100 }),
    ]).then(([o, p]) => {
      setOrders(o.data.data);
      setProducts(p.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Calculate analytics from orders
  const totalEarning    = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.vendorEarning || 0), 0), 0);
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const pendingOrders   = orders.filter((o) => ["pending","processing"].includes(o.status)).length;

  // Top products by sales
  const topProducts = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 5);

  // Monthly revenue (last 6 months)
  const monthlyData = (() => {
    const map = {};
    orders.forEach((o) => {
      const month = new Date(o.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
      const earn  = o.items.reduce((s, i) => s + (i.vendorEarning || 0), 0);
      map[month]  = (map[month] || 0) + earn;
    });
    return Object.entries(map).slice(-6);
  })();

  const maxRevenue = Math.max(...monthlyData.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your shop performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Earning"    value={`৳${totalEarning.toLocaleString()}`} color="green"  loading={loading} icon={() => <span>💰</span>} />
        <StatCard title="Total Orders"     value={orders.length}                        color="blue"   loading={loading} icon={() => <span>🛒</span>} />
        <StatCard title="Delivered"        value={deliveredOrders}                      color="teal"   loading={loading} icon={() => <span>✅</span>} />
        <StatCard title="Pending"          value={pendingOrders}                        color="amber"  loading={loading} icon={() => <span>⏳</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue Chart */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          {monthlyData.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.map(([month, value]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">{month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max((value / maxRevenue) * 100, 4)}%` }}
                    >
                      <span className="text-xs text-white font-medium">৳{value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Products */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No products yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">৳{p.price?.toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-teal-700">{p.salesCount || 0}</p>
                    <p className="text-xs text-gray-400">sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Product Status Summary */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Product Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Active",   status: "active",   color: "bg-green-50 text-green-700"  },
            { label: "Pending",  status: "pending",  color: "bg-amber-50 text-amber-700"  },
            { label: "Draft",    status: "draft",    color: "bg-gray-100 text-gray-600"   },
            { label: "Rejected", status: "rejected", color: "bg-red-50 text-red-700"      },
            { label: "Archived", status: "archived", color: "bg-gray-100 text-gray-500"   },
          ].map(({ label, status, color }) => {
            const count = products.filter((p) => p.status === status).length;
            return (
              <div key={status} className={`rounded-xl p-4 text-center ${color}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}