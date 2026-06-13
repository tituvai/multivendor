"use client";
import { useState, useEffect, useCallback } from "react";
import { orderAPI } from "@/services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button, SearchInput, Pagination, OrderStatusBadge, EmptyState } from "@/components/ui";

const TABS = ["all","pending","processing","shipped","delivered","cancelled"];

export default function VendorOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...(tab !== "all" && { status: tab }) };
      const res = await orderAPI.getVendorOrders(params);
      setOrders(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((s) => (
          <button key={s} onClick={() => { setTab(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all capitalize ${tab === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order #","Customer","Items","Earning","Date","Status","Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>)}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <EmptyState icon="🛒" title="No orders yet" description="Orders from customers will appear here" />
                  </td>
                </tr>
              ) : orders.map((o) => {
                const myItems   = o.items || [];
                const myEarning = myItems.reduce((s, i) => s + (i.vendorEarning || 0), 0);
                return (
                  <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/vendor/orders/${o._id}`}
                        className="font-mono text-xs font-semibold text-teal-700 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.customer?.name}</p>
                      <p className="text-xs text-gray-400">{o.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{myItems.length}</td>
                    <td className="px-4 py-3 font-semibold text-teal-700">৳{myEarning.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/vendor/orders/${o._id}`}>
                        <Button variant="secondary" size="xs">Manage</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-50">
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}