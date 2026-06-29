"use client";
import { useState, useEffect, useCallback } from "react";
import { flashSaleAPI, productAPI } from "@/services/api";
import toast from "react-hot-toast";
import { Button, SearchInput, Pagination, Modal, ConfirmDialog, EmptyState } from "@/components/ui";
import { Flame, Clock, Plus, Edit, Trash2, Eye } from "lucide-react";

const STATUS_TABS = ["all", "scheduled", "active", "expired", "cancelled"];

export default function AdminFlashSalesPage() {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [createModal, setCreateModal] = useState({ open: false });
  const [editModal, setEditModal] = useState({ open: false, flashSale: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    productAPI.getAll({ limit: 200, status: "active" })
      .then(res => setProductsList(res.data.data))
      .catch(err => console.error("Error loading products:", err));
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    items: [],
    bannerImage: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...(tab !== "all" && { status: tab }) };
      const res = await flashSaleAPI.adminGetAll(params);
      setFlashSales(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load flash sales"); }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      return toast.error("Please fill all required fields (Title, Start Time, End Time)");
    }
    setActionLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append("title", formData.title);
      dataToSend.append("description", formData.description || "");
      dataToSend.append("startTime", formData.startTime);
      dataToSend.append("endTime", formData.endTime);
      dataToSend.append("items", JSON.stringify(formData.items || []));
      if (formData.bannerImage) {
        dataToSend.append("bannerImage", formData.bannerImage);
      }

      console.log("Sending data:", dataToSend);
      await flashSaleAPI.create(dataToSend);
      toast.success("Flash sale created!");
      setCreateModal({ open: false });
      setFormData({ title: "", description: "", startTime: "", endTime: "", items: [], bannerImage: null });
      load();
    } catch (e) {
      console.error("Create error:", e);
      toast.error(e.response?.data?.message || e.message || "Failed");
    }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async () => {
    setActionLoading(true);
    try {
      await flashSaleAPI.update(editModal.flashSale._id, formData);
      toast.success("Flash sale updated!");
      setEditModal({ open: false, flashSale: null });
      setFormData({ title: "", description: "", startTime: "", endTime: "", items: [] });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await flashSaleAPI.delete(deleteConfirm.id);
      toast.success("Flash sale deleted");
      setDeleteConfirm({ open: false, id: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const openEditModal = (flashSale) => {
    setEditModal({ open: true, flashSale });
    setFormData({
      title: flashSale.title,
      description: flashSale.description,
      startTime: new Date(flashSale.startTime).toISOString().slice(0, 16),
      endTime: new Date(flashSale.endTime).toISOString().slice(0, 16),
      items: flashSale.items.map(item => ({
        product: item.product._id,
        discountPrice: item.discountPrice,
        stockLimit: item.stockLimit,
      })),
    });
  };

  const formatTime = (date) => new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-700",
      active: "bg-green-100 text-green-700",
      expired: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Flash Sales
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} flash sales total</p>
        </div>
        <Button onClick={() => setCreateModal({ open: true })} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Flash Sale
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => { setTab(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all capitalize ${tab === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Title", "Time", "Items", "Status", "Sales", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>)}
                  </tr>
                ))
              ) : flashSales.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No flash sales found</td></tr>
              ) : flashSales.map((fs) => (
                <tr key={fs._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {fs.bannerImage?.url ? (
                        <img
                          src={fs.bannerImage.url}
                          alt={fs.title}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center text-orange-500 border border-orange-50">
                          <Flame className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 max-w-[200px] truncate">{fs.title}</div>
                        {fs.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{fs.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      {formatTime(fs.startTime)} - {formatTime(fs.endTime)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fs.items?.length || 0} items</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(fs.status)}`}>
                      {fs.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fs.totalSales || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="xs" onClick={() => openEditModal(fs)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm({ open: true, id: fs._id })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
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

      {/* Create Modal */}
      <Modal open={createModal.open} onClose={() => setCreateModal({ open: false })} title="Create Flash Sale" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="e.g., Mega Summer Sale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="Sale description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, bannerImage: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            {formData.bannerImage && (
              <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={URL.createObjectURL(formData.bannerImage)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Optional: Upload a banner image for the flash sale</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>
          {/* Products Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <label className="block text-sm font-semibold text-gray-700">Flash Sale Products ({formData.items.length})</label>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    items: [...formData.items, { product: "", discountPrice: 0, stockLimit: 10 }]
                  });
                }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg">No products added. Click Add Product to include products in this sale.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-[150px]">
                      <select
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          const prodId = e.target.value;
                          const prod = productsList.find(p => p._id === prodId);
                          newItems[index].product = prodId;
                          if (prod) {
                            newItems[index].discountPrice = Math.round(prod.price * 0.9);
                            newItems[index].stockLimit = prod.stock;
                          }
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                      >
                        <option value="">Select Product</option>
                        {productsList.map(p => (
                          <option key={p._id} value={p._id}>{p.name} (৳{p.price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discountPrice || ""}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].discountPrice = Number(e.target.value);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Stock"
                        value={item.stockLimit || ""}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].stockLimit = Number(e.target.value);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = formData.items.filter((_, i) => i !== index);
                        setFormData({ ...formData, items: newItems });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs p-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setCreateModal({ open: false })}>Cancel</Button>
          <Button loading={actionLoading} onClick={handleCreate}>Create</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, flashSale: null })} title="Edit Flash Sale" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>
          
          {/* Products Selector */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <label className="block text-sm font-semibold text-gray-700">Flash Sale Products ({formData.items.length})</label>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    items: [...formData.items, { product: "", discountPrice: 0, stockLimit: 10 }]
                  });
                }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg">No products added. Click Add Product to include products in this sale.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-[150px]">
                      <select
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          const prodId = e.target.value;
                          const prod = productsList.find(p => p._id === prodId);
                          newItems[index].product = prodId;
                          if (prod) {
                            newItems[index].discountPrice = Math.round(prod.price * 0.9);
                            newItems[index].stockLimit = prod.stock;
                          }
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                      >
                        <option value="">Select Product</option>
                        {productsList.map(p => (
                          <option key={p._id} value={p._id}>{p.name} (৳{p.price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Discount"
                        value={item.discountPrice || ""}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].discountPrice = Number(e.target.value);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Stock"
                        value={item.stockLimit || ""}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].stockLimit = Number(e.target.value);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = formData.items.filter((_, i) => i !== index);
                        setFormData({ ...formData, items: newItems });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs p-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setEditModal({ open: false, flashSale: null })}>Cancel</Button>
          <Button loading={actionLoading} onClick={handleUpdate}>Update</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Flash Sale"
        message="This will permanently delete the flash sale. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
