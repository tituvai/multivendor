"use client";
import { useAuth } from "@/hooks/useAuth";

export default function AdminHeader({ onMenuClick }) {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
        >
          ☰
        </button>
        <h1 className="text-sm text-gray-500">
          Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
          🛡️ Admin
        </span>
      </div>
    </header>
  );
}