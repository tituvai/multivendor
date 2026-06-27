"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetMyOrdersQuery,
  useGetOrderDetailQuery,
  useCancelOrderMutation,
} from "@/redux/slices/ordersApi";
import { Button, Card, OrderStatusBadge, Spinner } from "@/components/ui";
import {
  User,
  ShoppingBag,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

// Tracking timeline helper
const TIMELINE_STAGES = [
  { status: "pending", label: "Pending", desc: "Waiting for seller approval" },
  { status: "processing", label: "Processing", desc: "Seller is packaging items" },
  { status: "shipped", label: "Shipped", desc: "Order is on the way" },
  { status: "delivered", label: "Delivered", desc: "Package handed over" },
];

export default function ProfileDashboard() {
  const { user, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // profile, orders, details
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Queries
  const { data: ordersRes, isLoading: ordersLoading, refetch: refetchOrders } = useGetMyOrdersQuery(
    { page: 1, limit: 20 },
    { skip: !isLoggedIn }
  );
  const myOrders = ordersRes?.data || [];

  const { data: detailRes, isLoading: detailLoading } = useGetOrderDetailQuery(
    selectedOrderId,
    { skip: !selectedOrderId }
  );
  const activeOrder = detailRes?.data;

  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab("details");
  };

  const handleCancelOrder = async (orderId) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      try {
        await cancelOrder({ id: orderId, reason: "Customer requested cancellation" }).unwrap();
        toast.success("Order cancelled");
        refetchOrders();
      } catch (err) {
        toast.error(err.data?.message || "Failed to cancel order");
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <h3 className="text-lg font-bold">Sign in Required</h3>
        <p className="text-sm text-slate-500 mt-1">Please sign in to access your profile dashboard</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button variant="primary">Log In</Button>
        </Link>
      </div>
    );
  }

  // Get active timeline index
  const getTimelineIndex = (status) => {
    if (status === "cancelled") return -1;
    return TIMELINE_STAGES.findIndex((stage) => stage.status === status);
  };

  const currentStageIdx = activeOrder ? getTimelineIndex(activeOrder.status) : -1;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Side Menu Tab Selector */}
      <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shrink-0 transition-colors">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center font-bold text-lg border border-orange-200">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{user.name}</h4>
            <p className="text-xs text-slate-400 capitalize truncate">{user.role} Dashboard</p>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {[
            { id: "profile", label: "My Profile", icon: User },
            { id: "orders", label: "Order History", icon: ShoppingBag },
          ].map((tab) => {
            const checked = activeTab === tab.id || (tab.id === "orders" && activeTab === "details");
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "orders") setSelectedOrderId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl text-left whitespace-nowrap transition cursor-pointer ${
                  checked
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <tab.icon className="w-4.5 h-4.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {/* Profile Details Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <Card className="p-6 space-y-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Full Name</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">{user.name}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Email Address</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-105 mt-1">{user.email}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Role Type</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-105 mt-1 capitalize">{user.role}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Joined On</span>
                  <p className="text-sm font-semibold text-slate-850 dark:text-slate-105 mt-1">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "June 2026"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Security & Management</h3>
              <p className="text-xs text-slate-500">To edit your profile, please reach out to admin support or check profile credentials settings.</p>
              <Button variant="secondary" className="text-xs">Change Password</Button>
            </Card>
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === "orders" && (
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">My Orders</h3>
              <p className="text-xs text-slate-450 mt-0.5">Manage and track your marketplace shipments</p>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" color="blue" />
              </div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl block mb-2">🛍️</span>
                <p className="text-sm text-slate-500">No orders found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850">
                    <tr className="text-slate-400 font-semibold text-xs">
                      {["Order ID", "Date", "Status", "Total Price", "Payment", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-left uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                    {myOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                          {ord.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={ord.status} />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">
                          ৳{ord.pricing?.total?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ord.payment?.status === "paid"
                              ? "bg-green-50 dark:bg-green-950/20 text-green-700"
                              : "bg-amber-50 dark:bg-amber-950/20 text-amber-700"
                          }`}>
                            {ord.payment?.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="secondary" size="xs" onClick={() => handleViewOrder(ord._id)}>
                              Track
                            </Button>
                            {["pending", "processing"].includes(ord.status) && (
                              <Button
                                variant="ghost"
                                size="xs"
                                className="text-red-500 hover:text-red-650"
                                onClick={() => handleCancelOrder(ord._id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Order Details & Track Tab */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("orders");
                  setSelectedOrderId(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Order Tracking</h3>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" color="blue" />
              </div>
            ) : !activeOrder ? (
              <p className="text-sm text-slate-400">Could not fetch order details.</p>
            ) : (
              <>
                {/* Timeline Panel */}
                <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-xs text-slate-400">Order ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{activeOrder.orderNumber}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Placed on {new Date(activeOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <OrderStatusBadge status={activeOrder.status} />
                  </div>

                  {activeOrder.status === "cancelled" ? (
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/40">
                      <XCircle className="w-6 h-6 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">This order has been cancelled.</p>
                        <p className="text-[10px] opacity-80">Reason: {activeOrder.cancellationReason || "Customer request"}</p>
                      </div>
                    </div>
                  ) : (
                    /* Dynamic progress line */
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 relative">
                      {TIMELINE_STAGES.map((stage, idx) => {
                        const isDone = idx <= currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <div key={stage.status} className="flex md:flex-col gap-4 items-start relative z-10">
                            {/* Visual circle bubble */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition ${
                              isDone
                                ? "bg-orange-500 border-orange-500 text-white font-bold"
                                : "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-850 dark:border-slate-800"
                            } ${isCurrent ? "ring-4 ring-orange-500/20" : ""}`}>
                              {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>

                            {/* Label descriptions */}
                            <div>
                              <p className={`text-xs font-bold ${isDone ? "text-slate-850 dark:text-white" : "text-slate-400"}`}>
                                {stage.label}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">{stage.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Items & Shipping address cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Items */}
                  <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Items Summary</h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {activeOrder.items?.map((item, idx) => (
                        <div key={idx} className="py-3 flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">Quantity: {item.quantity}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Ship address details */}
                  <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Delivery Information</h4>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold">Recipient</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{activeOrder.shippingAddress?.fullName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Contact Phone</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{activeOrder.shippingAddress?.phone}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Shipping Address</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {activeOrder.shippingAddress?.address}, {activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.district}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Billing Payment</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{activeOrder.paymentMethod} ({activeOrder.payment?.status})</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
