"use client";
import { useState, useEffect, useCallback } from "react";
import { bannerAPI, categoryAPI } from "@/services/api";
import toast from "react-hot-toast";
import { Button, SearchInput, Pagination, Modal, ConfirmDialog } from "@/components/ui";
import { Image as ImageIcon, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

const POSITION_OPTIONS = ["hero", "middle", "bottom"];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [createModal, setCreateModal] = useState({ open: false });
  const [editModal, setEditModal] = useState({ open: false, banner: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    position: "hero",
    isActive: true,
    order: 0,
    image: null,
  });

  const loadCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.data || []);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      const res = await bannerAPI.adminGetAll(params);
      setBanners(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load banners"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); loadCategories(); }, [load]);

  const handleCreate = async () => {
    if (!formData.category || !formData.image) {
      return toast.error("Please fill all required fields (Category, Image)");
    }
    setActionLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("category", formData.category);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("isActive", formData.isActive);
      formDataToSend.append("order", formData.order);
      formDataToSend.append("image", formData.image);

      await bannerAPI.create(formDataToSend);
      toast.success("Banner created!");
      setCreateModal({ open: false });
      setFormData({ category: "", position: "hero", isActive: true, order: 0, image: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async () => {
    setActionLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("category", formData.category);
      formDataToSend.append("position", formData.position);
      formDataToSend.append("isActive", formData.isActive);
      formDataToSend.append("order", formData.order);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await bannerAPI.update(editModal.banner._id, formDataToSend);
      toast.success("Banner updated!");
      setEditModal({ open: false, banner: null });
      setFormData({ category: "", position: "hero", isActive: true, order: 0, image: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await bannerAPI.delete(deleteConfirm.id);
      toast.success("Banner deleted");
      setDeleteConfirm({ open: false, id: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (id) => {
    try {
      await bannerAPI.toggleStatus(id);
      toast.success("Banner status updated");
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  const openEditModal = (banner) => {
    setEditModal({ open: true, banner });
    setFormData({
      category: banner.category?._id || banner.category,
      position: banner.position,
      isActive: banner.isActive,
      order: banner.order,
      image: null,
    });
  };

  const formatTime = (date) => new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getPositionColor = (position) => {
    const colors = {
      hero: "bg-purple-100 text-purple-700",
      middle: "bg-blue-100 text-blue-700",
      bottom: "bg-green-100 text-green-700",
    };
    return colors[position] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-purple-500" />
            Banners
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} banners total</p>
        </div>
        <Button onClick={() => setCreateModal({ open: true })} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Banner
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Image", "Category", "Position", "Status", "Order", "Actions"].map((h) => (
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
              ) : banners.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No banners found</td></tr>
              ) : banners.map((banner) => (
                <tr key={banner._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <img src={banner.image.url} alt="Banner" className="w-16 h-10 object-cover rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-[200px] truncate">
                      {banner.category?.name || "Unknown"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPositionColor(banner.position)}`}>
                      {banner.position}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(banner._id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{banner.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="xs" onClick={() => openEditModal(banner)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm({ open: true, id: banner._id })}>
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
      <Modal open={createModal.open} onClose={() => setCreateModal({ open: false })} title="Create Banner" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Active</label>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setCreateModal({ open: false })}>Cancel</Button>
          <Button loading={actionLoading} onClick={handleCreate}>Create</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, banner: null })} title="Edit Banner" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Active</label>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={() => setEditModal({ open: false, banner: null })}>Cancel</Button>
          <Button loading={actionLoading} onClick={handleUpdate}>Update</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Banner"
        message="This will permanently delete the banner. This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
