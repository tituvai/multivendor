"use client";
import { useState, useEffect, useCallback } from "react";
import API from "@/services/axios";
import toast from "react-hot-toast";
import { Button, Badge, SearchInput, Pagination } from "@/components/ui";

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("all");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append("search", search);
      if (role !== "all") params.append("role", role);
      const res = await API.get(`/users?${params}`);
      setUsers(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, [search, role, page]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (id, current) => {
    try {
      await API.patch(`/users/${id}/toggle-active`);
      toast.success(`User ${current ? "deactivated" : "activated"}`);
      load();
    } catch { toast.error("Failed"); }
  };

  const roleColor = { customer: "info", vendor: "teal", admin: "purple" };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} users total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none">
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="w-full sm:w-56" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User","Role","Email Verified","Joined","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-24 rounded" /></td>)}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleColor[u.role] || "gray"} className="capitalize">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.isEmailVerified ? (
                      <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">⚠ Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "admin" && (
                      <Button
                        variant={u.isActive ? "warning" : "success"}
                        size="xs"
                        onClick={() => handleToggleActive(u._id, u.isActive)}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
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
    </div>
  );
}