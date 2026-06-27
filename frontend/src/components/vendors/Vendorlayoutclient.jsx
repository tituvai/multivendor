"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui";
import VendorSidebar from "./Vendorsidebar";

export default function VendorLayoutClient({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isVendor, initialized, loadUser } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!initialized) loadUser(); }, []);

  useEffect(() => {
    if (initialized && !isVendor) {
      router.replace(user ? "/" : "/auth/login");
    }
  }, [initialized, isVendor, user, router]);

  if (!initialized) return <PageLoader />;
  if (!isVendor) return <PageLoader />;

  // Vendor not approved yet
  if (!user?.vendorInfo?.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Approval Pending</h2>
          <p className="text-gray-500 text-sm">Your vendor account is under review. We'll notify you by email once approved (usually 2–3 business days).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <VendorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">☰</button>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{user?.vendorInfo?.shopName}</span>
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
            🏪 Vendor
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}