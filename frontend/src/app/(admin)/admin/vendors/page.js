"use client";
import { useState, useEffect, useCallback } from "react";
import { vendorAPI } from "@/services/api";
import toast from "react-hot-toast";
import {
  Button, Badge, SearchInput, Pagination,
  Modal, ConfirmDialog, VendorStatusBadge, Spinner, EmptyState
} from "@/components/ui";

const TABS = [
  { key: "pending",   label: "Pending",   color: "text-amber-600" },
  { key: "approved",  label: "Approved",  color: "text-green-600" },
  { key: "rejected",  label: "Rejected",  color: "text-red-600"   },
  { key: "suspended", label: "Suspended", color: "text-gray-600"  },
  { key: "all",       label: "All",       color: "text-blue-600"  },
];

export default function AdminVendorsPage() {
  const [vendors,  setVendors]  = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("pending");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);

  // Action modals
  const [rejectModal,  setRejectModal]  = useState({ open: false, vendor: null });
  const [suspendModal, setSuspendModal] = useState({ open: false, vendor: null });
  const [detailModal,  setDetailModal]  = useState({ open: false, vendor: null });
  const [reason,       setReason]       = useState("");
  const [actionLoading,setActionLoading]= useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.adminGetAll({ status: tab, search, page, limit: 10 });
      setVendors(res.data.data);
      setSummary(res.data.summary || {});
      setPages(res.data.pages);
    } catch { toast.error("Failed to load vendors"); }
    finally { setLoading(false); }
  }, [tab, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await vendorAPI.approve(id, {});
      toast.success("Vendor approved!");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!reason.trim()) return toast.error("Please enter a reason");
    setActionLoading(true);
    try {
      await vendorAPI.reject(rejectModal.vendor._id, { reason });
      toast.success("Vendor rejected");
      setRejectModal({ open: false, vendor: null });
      setReason("");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) return toast.error("Please enter a reason");
    setActionLoading(true);
    try {
      await vendorAPI.suspend(suspendModal.vendor._id, { reason });
      toast.success("Vendor suspended");
      setSuspendModal({ open: false, vendor: null });
      setReason("");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleReactivate = async (id) => {
    setActionLoading(true);
    try {
      await vendorAPI.reactivate(id);
      toast.success("Vendor reactivated!");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage vendor applications and accounts</p>
        </div>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search vendors..." className="w-full sm:w-64" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
            {summary[t.key] > 0 && (
              <span className={`ml-1.5 text-xs font-semibold ${t.color}`}>({summary[t.key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Vendor / Shop", "Contact", "Applied", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-24 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-gray-400">No vendors found</td></tr>
              ) : vendors.map((v) => (
                <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-500">{v.vendorInfo?.shopName || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{v.email}</p>
                    <p className="text-xs text-gray-400">{v.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {v.vendorInfo?.appliedAt ? new Date(v.vendorInfo.appliedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <VendorStatusBadge status={v.vendorInfo?.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button variant="ghost" size="xs" onClick={() => setDetailModal({ open: true, vendor: v })}>View</Button>
                      {v.vendorInfo?.status === "pending" && (
                        <>
                          <Button variant="success" size="xs" loading={actionLoading} onClick={() => handleApprove(v._id)}>Approve</Button>
                          <Button variant="danger"  size="xs" onClick={() => { setRejectModal({ open: true, vendor: v }); setReason(""); }}>Reject</Button>
                        </>
                      )}
                      {v.vendorInfo?.status === "approved" && (
                        <Button variant="warning" size="xs" onClick={() => { setSuspendModal({ open: true, vendor: v }); setReason(""); }}>Suspend</Button>
                      )}
                      {v.vendorInfo?.status === "suspended" && (
                        <Button variant="success" size="xs" loading={actionLoading} onClick={() => handleReactivate(v._id)}>Reactivate</Button>
                      )}
                      {v.vendorInfo?.status === "rejected" && (
                        <Button variant="success" size="xs" loading={actionLoading} onClick={() => handleApprove(v._id)}>Approve</Button>
                      )}
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
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, vendor: null })} title="Reject Vendor Application">
        <p className="text-sm text-gray-600 mb-4">Rejecting <strong>{rejectModal.vendor?.vendorInfo?.shopName}</strong>. Please provide a reason:</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Enter rejection reason..." className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none" />
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setRejectModal({ open: false, vendor: null })}>Cancel</Button>
          <Button variant="danger" loading={actionLoading} onClick={handleReject}>Reject Vendor</Button>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal open={suspendModal.open} onClose={() => setSuspendModal({ open: false, vendor: null })} title="Suspend Vendor">
        <p className="text-sm text-gray-600 mb-4">Suspending <strong>{suspendModal.vendor?.vendorInfo?.shopName}</strong>. All their products will be archived:</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Enter suspension reason..." className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none" />
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="secondary" onClick={() => setSuspendModal({ open: false, vendor: null })}>Cancel</Button>
          <Button variant="warning" loading={actionLoading} onClick={handleSuspend}>Suspend</Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailModal.open} onClose={() => setDetailModal({ open: false, vendor: null })} title="Vendor Details" size="lg">
        {detailModal.vendor && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Name",         detailModal.vendor.name],
                ["Email",        detailModal.vendor.email],
                ["Phone",        detailModal.vendor.phone || "—"],
                ["Shop Name",    detailModal.vendor.vendorInfo?.shopName || "—"],
                ["Shop Phone",   detailModal.vendor.vendorInfo?.shopPhone || "—"],
                ["Shop Email",   detailModal.vendor.vendorInfo?.shopEmail || "—"],
                ["NID Number",   detailModal.vendor.vendorInfo?.nidNumber || "—"],
                ["Shop Address", detailModal.vendor.vendorInfo?.shopAddress || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-gray-800 font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {detailModal.vendor.vendorInfo?.shopDescription && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Description</p>
                <p className="text-gray-700">{detailModal.vendor.vendorInfo.shopDescription}</p>
              </div>
            )}
            {detailModal.vendor.vendorInfo?.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection Reason</p>
                <p className="text-sm text-red-600">{detailModal.vendor.vendorInfo.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}