"use client";
import { useState, useEffect, useCallback } from "react";
import { categoryAPI } from "@/services/api";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button, Modal, ConfirmDialog, Badge, SearchInput, Pagination } from "@/components/ui";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);

  const [formModal,     setFormModal]     = useState({ open: false, category: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll({ page, limit: 15, search, includeInactive: true });
      setCategories(res.data.data);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Load parent options (level 0 and 1 only)
  useEffect(() => {
    categoryAPI.getAll({ limit: 100 }).then((res) => {
      setParentOptions(res.data.data.filter((c) => c.level < 2));
    }).catch(() => {});
  }, []);

  const openForm = (cat = null) => {
    reset(cat ? {
      name: cat.name, description: cat.description,
      commission: cat.commission, icon: cat.icon,
      sortOrder: cat.sortOrder, isFeatured: cat.isFeatured,
      parent: cat.parent?._id || "",
    } : { name: "", description: "", commission: 10, icon: "", sortOrder: 0, isFeatured: false, parent: "" });
    setFormModal({ open: true, category: cat });
  };

  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      const isUpdate = !!formModal.category;
      
      // If an image file was selected, send as FormData
      if (data.image && data.image.length > 0) {
        const form = new FormData();
        form.append("name", data.name);
        form.append("description", data.description || "");
        form.append("commission", Number(data.commission));
        form.append("sortOrder", Number(data.sortOrder));
        form.append("parent", data.parent || "");
        form.append("isFeatured", data.isFeatured ? "true" : "false");
        form.append("icon", data.icon || "");
        form.append("image", data.image[0]);

        if (isUpdate) {
          await categoryAPI.update(formModal.category._id, form);
        } else {
          await categoryAPI.create(form);
        }
      } else {
        const { image, ...rest } = data;
        const payload = {
          ...rest,
          commission: Number(data.commission),
          sortOrder: Number(data.sortOrder),
          parent: data.parent || null,
        };
        if (isUpdate) {
          await categoryAPI.update(formModal.category._id, payload);
        } else {
          await categoryAPI.create(payload);
        }
      }

      toast.success(isUpdate ? "Category updated!" : "Category created!");
      setFormModal({ open: false, category: null });
      load();
    } catch (e) { 
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to save category"); 
    }
    finally { setActionLoading(false); }
  };

  const handleToggle = async (id) => {
    try {
      await categoryAPI.toggle(id);
      toast.success("Status updated!");
      load();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await categoryAPI.delete(deleteConfirm.id);
      toast.success("Category deleted!");
      setDeleteConfirm({ open: false, id: null });
      load();
    } catch (e) { toast.error(e.response?.data?.message || "Failed — may have subcategories"); }
    finally { setActionLoading(false); }
  };

  const levelLabel = (level) => ["Root", "Sub", "Sub-sub"][level] || `L${level}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} categories total</p>
        </div>
        <div className="flex gap-2">
          <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="w-full sm:w-56" />
          <Button variant="admin" onClick={() => openForm()}>+ Add</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Category","Level","Parent","Commission","Products","Status","Featured","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(8).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-16 rounded" /></td>)}
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-400">No categories found</td></tr>
              ) : categories.map((c) => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.image?.url ? (
                        <img src={c.image.url} alt={c.name} className="w-8 h-8 object-cover rounded" />
                      ) : (
                        c.icon && <span>{c.icon}</span>
                      )}
                      <span className="font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={["info","purple","teal"][c.level] || "gray"}>{levelLabel(c.level)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.parent?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{c.commission}%</td>
                  <td className="px-4 py-3 text-gray-700">{c.productCount}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c._id)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${c.isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">{c.isFeatured ? "⭐" : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="xs" onClick={() => openForm(c)}>Edit</Button>
                      <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm({ open: true, id: c._id })}>Delete</Button>
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

      {/* Create / Edit Modal */}
      <Modal open={formModal.open} onClose={() => setFormModal({ open: false, category: null })}
        title={formModal.category ? "Edit Category" : "Add Category"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
              <input {...register("name", { required: "Name is required" })}
                placeholder="e.g. Electronics"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${errors.name ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200 focus:border-blue-500"}`} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Category</label>
              <select {...register("parent")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">None (Root)</option>
                {parentOptions.map((p) => (
                  <option key={p._id} value={p._id}>{"—".repeat(p.level)} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission (%)</label>
              <input type="number" min={0} max={100} {...register("commission")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
              <input {...register("icon")} placeholder="🖥️"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
              <input type="number" {...register("sortOrder")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea {...register("description")} rows={2} placeholder="Optional description..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
              <input type="file" accept="image/*" {...register("image")} className="w-full text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isFeatured" {...register("isFeatured")} className="w-4 h-4 rounded text-blue-600" />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Featured on homepage</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setFormModal({ open: false, category: null })}>Cancel</Button>
            <Button variant="admin" type="submit" loading={actionLoading}>
              {formModal.category ? "Update" : "Create"} Category
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        message="This will delete the category. Categories with subcategories cannot be deleted unless subcategories are removed first."
        confirmText="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}