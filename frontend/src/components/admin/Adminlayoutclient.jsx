"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import { PageLoader } from "@/components/ui";
import AdminSidebar from "./Adminsidebar";
import AdminHeader from "./Adminheader";

export default function AdminLayoutClient({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, initialized, loadUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) loadUser();
  }, []);

  useEffect(() => {
    if (initialized && !isAdmin) {
      router.replace(user ? "/" : "/auth/login");
    }
  }, [initialized, isAdmin, user, router]);

  if (!initialized) return <PageLoader />;
  if (!isAdmin) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}