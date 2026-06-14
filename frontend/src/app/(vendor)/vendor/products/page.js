"use client";
import { useState, useEffect, useCallback } from "react";
import { productAPI } from "@/services/api";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { Button, SearchInput, Pagination, ProductStatusBadge, ConfirmDialog, EmptyState } from "@/components/ui";

const TABS = ["all","active","pending","draft","rejected","archived"];

export default function VendorProductsPage() {
  const [products, setProducts] = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [delConfirm, setDelConfirm] = useState({ open: false, id: null });
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...(tab !== "all" && { status: tab }), ...(search && { search }) };
      const res = await productAPI.getMyProducts(params);
      setProducts(res.data.data);
      setSummary(res.data.summary || {});
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }, [tab, search, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await productAPI.delete(delConfirm.id);
      toast.success("Product deleted");
      setDelConfirm({ open: false, id: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} products</p>
        </div>
        <div className="flex gap-2">
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="w-full sm:w-56" />
          <Link href="/vendor/add_product">
            <Button variant="vendor">+ Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((s) => (
          <button key={s} onClick={() => { setTab(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all capitalize ${tab === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {s === "all" ? "All" : s}
            {summary[s] > 0 && <span className="ml-1 text-xs text-gray-400">({summary[s]})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product","Category","Price","Stock","Status","Sales","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>)}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <EmptyState icon="📦" title="No products yet" description="Start adding products to your shop"
                      action={<Link href="/vendor/products/add"><Button variant="vendor">Add First Product</Button></Link>} />
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.images?.[0]?.url
                          ? <Image src={p.images[0].url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                          : <span className="flex items-center justify-center h-full text-gray-300 text-lg">📦</span>}
                      </div>
                      <p className="font-medium text-gray-900 max-w-[160px] truncate">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">৳{p.price?.toLocaleString()}</p>
                    {p.discountPrice > 0 && <p className="text-xs text-green-600">৳{p.discountPrice?.toLocaleString()}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? "text-red-500 font-semibold" : "text-gray-700"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{p.salesCount || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Link href={`/vendor/products/edit/${p._id}`}>
                        <Button variant="secondary" size="xs">Edit</Button>
                      </Link>
                      <Button variant="ghost" size="xs" onClick={() => setDelConfirm({ open: true, id: p._id })}>Delete</Button>
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

      <ConfirmDialog
        open={delConfirm.open} onClose={() => setDelConfirm({ open: false, id: null })}
        onConfirm={handleDelete} title="Delete Product"
        message="This will permanently delete the product and all its images."
        confirmText="Delete" variant="danger" loading={delLoading} />
    </div>
  );
}