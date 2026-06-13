"use client";
import { useState, useEffect } from "react";
import { orderAPI } from "@/services/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button, OrderStatusBadge, Modal, PageLoader, Card } from "@/components/ui";

export default function AdminOrderDetailPage() {
  const { id }    = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [status,  setStatus]  = useState("");
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    orderAPI.getOne(id)
      .then((r) => { setOrder(r.data.data); setStatus(r.data.data.status); })
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await orderAPI.adminUpdateStatus(id, { status, note });
      toast.success("Status updated!");
      setModal(false);
      const r = await orderAPI.getOne(id);
      setOrder(r.data.data);
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  if (!order)  return <div className="text-center py-20 text-gray-400">Order not found</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">← Back to Orders</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1 font-mono">{order.orderNumber}</h1>
          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <Button variant="admin" size="sm" onClick={() => setModal(true)}>Update Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
          <p className="font-semibold text-gray-900">{order.customer?.name}</p>
          <p className="text-sm text-gray-500">{order.customer?.email}</p>
        </Card>

        {/* Shipping */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ship To</p>
          <p className="font-semibold text-gray-900">{order.shippingAddress?.fullName}</p>
          <p className="text-sm text-gray-500">{order.shippingAddress?.address}</p>
          <p className="text-sm text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.district}</p>
          <p className="text-sm text-gray-500">📞 {order.shippingAddress?.phone}</p>
        </Card>

        {/* Payment */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment</p>
          <p className="font-semibold text-gray-900 capitalize">{order.payment?.method}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.payment?.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {order.payment?.status}
          </span>
          {order.payment?.transactionId && <p className="text-xs text-gray-400 mt-1">TxID: {order.payment.transactionId}</p>}
        </Card>
      </div>

      {/* Items */}
      <Card>
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Order Items ({order.items?.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item) => (
            <div key={item._id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">Vendor: {item.vendor?.vendorInfo?.shopName || item.vendor?.name}</p>
                {item.variant?.label && <p className="text-xs text-gray-400">{item.variant.name}: {item.variant.label}</p>}
              </div>
              <div className="text-right text-sm flex-shrink-0">
                <p className="text-gray-500">৳{item.price?.toLocaleString()} × {item.quantity}</p>
                <p className="font-semibold text-gray-900">৳{(item.price * item.quantity)?.toLocaleString()}</p>
                <p className="text-xs text-teal-600 mt-0.5">Vendor earns: ৳{item.vendorEarning?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-1.5">
          {[
            ["Subtotal",         `৳${order.pricing?.subtotal?.toLocaleString()}`],
            ["Shipping",         `৳${order.pricing?.shippingCharge?.toLocaleString()}`],
            ...(order.pricing?.discount > 0 ? [["Discount", `-৳${order.pricing?.discount?.toLocaleString()}`]] : []),
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm text-gray-600">
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>৳{order.pricing?.total?.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      {order.statusHistory?.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
          <div className="space-y-3">
            {[...order.statusHistory].reverse().map((h, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium text-gray-900 capitalize">{h.status}</p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(h.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Update Order Status">
        <div className="space-y-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
            {["processing","shipped","delivered","cancelled","refunded"].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Note (optional)..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="admin" loading={saving} onClick={handleUpdate}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}