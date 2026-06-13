"use client";
import { useState, useEffect, useCallback } from "react";
import { productAPI } from "@/services/api";
import toast from "react-hot-toast";
import Image from "next/image";
import { Button, SearchInput, Pagination, Modal, ProductStatusBadge, ConfirmDialog, EmptyState } from "@/components/ui";

const STATUS_TABS = ["all","pending","active","rejected","draft","archived"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("pending");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);

  const [rejectModal,   setRejectModal]   = useState({ open: false, product: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [rejectReason,  setRejectReason]  = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...(tab !== "all" && { status: tab }), ...(search && { search }) };
      const res = await productAPI.adminGetAll(params);
      setProducts(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }, [tab, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await productAPI.approve(id);
      toast.success("Product approved!");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Please enter a reason");
    setActionLoading(true);
    try {
      await productAPI.reject(rejectModal.product._id, { reason: rejectReason });
      toast.success("Product rejected");
      setRejectModal({ open: false, product: null });
      setRejectReason("");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await productAPI.delete(deleteConfirm.id);
      toast.success("Product deleted");
      setDeleteConfirm({ open: false, id: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await productAPI.toggleFeatured(id);
      toast.success("Updated!");
      load();
    } catch (e) { toast.error("Failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} products total</p>
        </div>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="w-full sm:w-64" />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {STATUS_TABS.map((s) => (
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
                {["Product", "Vendor", "Price", "Stock", "Status", "Featured", "Actions"].map((h) => (
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
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-400">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {p.images?.[0]?.url ? (
                          <Image src={p.images[0].url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : <span className="flex items-center justify-center h-full text-gray-300">📦</span>}
                      </div>
                      <p className="font-medium text-gray-900 max-w-[160px] truncate">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.vendor?.vendorInfo?.shopName || p.vendor?.name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">৳{p.price?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? "text-red-500 font-medium" : "text-gray-700"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleFeatured(p._id)}
                      className={`text-lg transition ${p.isFeatured ? "opacity-100" : "opacity-30 hover:opacity-60"}`}>⭐</button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.status === "pending" && (
                        <>
                          <Button variant="success" size="xs" loading={actionLoading} onClick={() => handleApprove(p._id)}>Approve</Button>
                          <Button variant="danger"  size="xs" onClick={() => { setRejectModal({ open: true, product: p }); setRejectReason(""); }}>Reject</Button>
                        </>
                      )}
                      <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm({ open: true, id: p._id })}>Delete</Button>
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

      {/* Reject Modal */}
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, product: null })} title="Reject Product">
        <p className="text-sm text-gray-600 mb-3">Rejecting <strong>{rejectModal.product?.name}</strong>. Please provide a reason for the vendor:</p>
        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
          placeholder="e.g. Images are low quality, description is incomplete..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setRejectModal({ open: false, product: null })}>Cancel</Button>
          <Button variant="danger" loading={actionLoading} onClick={handleReject}>Reject</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message="This will permanently delete the product and all its images. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}