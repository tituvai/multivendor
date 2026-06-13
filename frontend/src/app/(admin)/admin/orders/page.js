"use client";
import { useState, useEffect, useCallback } from "react";
import { orderAPI } from "@/services/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button, SearchInput, Pagination, Modal, OrderStatusBadge } from "@/components/ui";

const STATUS_TABS = ["all","pending","processing","shipped","delivered","cancelled"];

export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const [statusModal,   setStatusModal]   = useState({ open: false, order: null });
  const [newStatus,     setNewStatus]     = useState("");
  const [statusNote,    setStatusNote]    = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(tab !== "all" && { status: tab }), ...(search && { search }) };
      const res = await orderAPI.adminGetAll(params);
      setOrders(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [tab, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return toast.error("Select a status");
    setActionLoading(true);
    try {
      await orderAPI.adminUpdateStatus(statusModal.order._id, { status: newStatus, note: statusNote });
      toast.success("Order status updated!");
      setStatusModal({ open: false, order: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} orders total</p>
        </div>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order #..." className="w-full sm:w-64" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => { setTab(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all capitalize ${tab === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {s === "all" ? "All Orders" : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order #","Customer","Items","Total","Payment","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>)}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-400">No orders found</td></tr>
              ) : orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o._id}`} className="font-mono text-xs text-blue-600 hover:underline font-semibold">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.customer?.name}</p>
                    <p className="text-xs text-gray-400">{o.customer?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.items?.length}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">৳{o.pricing?.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.payment?.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {o.payment?.method} / {o.payment?.status}
                    </span>
                  </td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Link href={`/admin/orders/${o._id}`}>
                        <Button variant="ghost" size="xs">View</Button>
                      </Link>
                      <Button variant="secondary" size="xs" onClick={() => { setStatusModal({ open: true, order: o }); setNewStatus(o.status); setStatusNote(""); }}>
                        Update
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-50">
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal open={statusModal.open} onClose={() => setStatusModal({ open: false, order: null })} title="Update Order Status">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Order <strong className="font-mono">{statusModal.order?.orderNumber}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
              <option value="">Select status</option>
              {["processing","shipped","delivered","cancelled","refunded"].map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
            <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2}
              placeholder="Add a note for this status change..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusModal({ open: false, order: null })}>Cancel</Button>
            <Button variant="admin" loading={actionLoading} onClick={handleUpdateStatus}>Update Status</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}