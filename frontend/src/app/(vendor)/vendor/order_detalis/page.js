"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { orderAPI } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button, OrderStatusBadge, Modal, PageLoader, Card, Badge } from "@/components/ui";

const ITEM_STATUSES = ["processing","shipped","delivered"];

export default function VendorOrderDetailPage() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState({ open: false, item: null });
  const [form,    setForm]    = useState({ status: "", trackingNo: "", carrier: "", note: "" });
  const [saving,  setSaving]  = useState(false);

  const loadOrder = () => {
    orderAPI.getOne(id)
      .then((r) => setOrder(r.data.data))
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrder(); }, [id]);

  const openModal = (item) => {
    setForm({ status: item.status === "pending" ? "processing" : "shipped", trackingNo: item.tracking?.trackingNo || "", carrier: item.tracking?.carrier || "", note: "" });
    setModal({ open: true, item });
  };

  const handleUpdateStatus = async () => {
    if (!form.status) return;
    setSaving(true);
    try {
      await orderAPI.updateItemStatus(id, modal.item._id, form);
      toast.success(`Item marked as ${form.status}!`);
      setModal({ open: false, item: null });
      loadOrder();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  if (!order)  return <div className="text-center py-20 text-gray-400">Order not found</div>;

  const myItems   = order.items?.filter((i) => i.vendor?._id === user?._id || i.vendor === user?._id) || [];
  const myEarning = myItems.reduce((s, i) => s + (i.vendorEarning || 0), 0);

  const itemStatusColor = {
    pending:    "bg-amber-50 text-amber-700",
    processing: "bg-blue-50 text-blue-700",
    shipped:    "bg-purple-50 text-purple-700",
    delivered:  "bg-green-50 text-green-700",
    cancelled:  "bg-red-50 text-red-700",
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/vendor/orders" className="text-sm text-teal-600 hover:underline">← Back to Orders</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1 font-mono">{order.orderNumber}</h1>
          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Your Earning</p>
          <p className="text-xl font-bold text-teal-700">৳{myEarning.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Your Items</p>
          <p className="text-xl font-bold text-gray-900">{myItems.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Payment</p>
          <p className={`text-sm font-bold capitalize ${order.payment?.status === "paid" ? "text-green-600" : "text-amber-600"}`}>
            {order.payment?.method} / {order.payment?.status}
          </p>
        </Card>
      </div>

      {/* Shipping Address */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-3">📦 Ship To</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-900">{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.address}</p>
          <p>{order.shippingAddress?.city}, {order.shippingAddress?.district}</p>
          <p className="font-medium">📞 {order.shippingAddress?.phone}</p>
        </div>
      </Card>

      {/* My Items */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Your Items</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {myItems.map((item) => (
            <div key={item._id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.variant?.label && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}: {item.variant.label}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-0.5">
                    ৳{item.price?.toLocaleString()} × {item.quantity} =
                    <span className="font-semibold text-gray-900 ml-1">৳{(item.price * item.quantity)?.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-teal-600 mt-0.5">Your earning: ৳{item.vendorEarning?.toLocaleString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${itemStatusColor[item.status] || "bg-gray-100 text-gray-600"}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Tracking info */}
              {item.tracking?.trackingNo && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-3">
                  <span className="font-medium">Tracking:</span> {item.tracking.carrier} — {item.tracking.trackingNo}
                  {item.tracking.shippedAt && <span className="ml-2 text-gray-400">Shipped: {new Date(item.tracking.shippedAt).toLocaleDateString()}</span>}
                </div>
              )}

              {/* Action button */}
              {!["delivered","cancelled","returned"].includes(item.status) && order.payment?.status === "paid" && (
                <Button variant="vendor" size="sm" onClick={() => openModal(item)}>
                  {item.status === "pending" ? "Start Processing" : item.status === "processing" ? "Mark as Shipped" : "Mark as Delivered"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Customer Note */}
      {order.customerNote && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Customer Note</p>
          <p className="text-sm text-gray-700">{order.customerNote}</p>
        </Card>
      )}

      {/* Update Status Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title="Update Item Status">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium">{modal.item?.name}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-200">
              {ITEM_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>

          {form.status === "shipped" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Courier / Carrier</label>
                <input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                  placeholder="e.g. Pathao, Steadfast, SA Paribahan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tracking Number</label>
                <input value={form.trackingNo} onChange={(e) => setForm({ ...form, trackingNo: e.target.value })}
                  placeholder="e.g. PT1234567890"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2}
              placeholder="Add a note..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none" />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal({ open: false, item: null })}>Cancel</Button>
            <Button variant="vendor" loading={saving} onClick={handleUpdateStatus}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}