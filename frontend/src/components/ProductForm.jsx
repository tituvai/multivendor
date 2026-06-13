"use client";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { categoryAPI } from "@/services/api";
import { Button, Input, Textarea, Select } from "@/components/ui";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ProductForm({ defaultValues, onSubmit, loading, mode = "create" }) {
  const [categories,  setCategories]  = useState([]);
  const [previews,    setPreviews]    = useState(defaultValues?.images || []);
  const [newFiles,    setNewFiles]    = useState([]);
  const [deleteIds,   setDeleteIds]   = useState([]);
  const fileRef = useRef();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: defaultValues || {
      name: "", description: "", shortDescription: "",
      price: "", discountPrice: "", stock: "",
      category: "", tags: "", sku: "",
      "shipping.isFreeShipping": false,
      "shipping.shippingCost": 0,
    },
  });

  useEffect(() => {
    categoryAPI.getAll({ limit: 100, isActive: true }).then((r) => setCategories(r.data.data)).catch(() => {});
    if (defaultValues) reset(defaultValues);
    if (defaultValues?.images) setPreviews(defaultValues.images);
  }, [defaultValues]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = previews.filter(p => !p.toDelete).length + files.length;
    if (totalImages > 5) return toast.error("Maximum 5 images allowed");

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, { url, isNew: true, file }]);
    });
    setNewFiles((prev) => [...prev, ...files]);
  };

  const removeImage = (index, img) => {
    if (img.publicId) {
      setDeleteIds((prev) => [...prev, img.publicId]);
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (img.isNew) {
      setNewFiles((prev) => prev.filter((f) => f !== img.file));
    }
  };

  const submit = (data) => {
    const fd = new FormData();

    // Text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        fd.append(key, value);
      }
    });

    // New image files
    newFiles.forEach((file) => fd.append("images", file));

    // Images to delete (edit mode)
    if (deleteIds.length > 0) {
      fd.append("deleteImages", JSON.stringify(deleteIds));
    }

    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>

        <Input label="Product Name *" placeholder="e.g. iPhone 15 Pro Max"
          error={errors.name?.message}
          {...register("name", { required: "Product name is required" })} />

        <Textarea label="Description *" rows={4} placeholder="Describe your product in detail..."
          error={errors.description?.message}
          {...register("description", { required: "Description is required" })} />

        <Textarea label="Short Description" rows={2}
          placeholder="Brief summary (shown on product cards)..."
          {...register("shortDescription")} />

        <Select label="Category *" error={errors.category?.message}
          {...register("category", { required: "Category is required" })}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {"—".repeat(c.level)} {c.name}
            </option>
          ))}
        </Select>

        <Input label="Tags (comma-separated)" placeholder="e.g. electronics, mobile, apple"
          {...register("tags")} />
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing & Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Price (৳) *" type="number" min={0} placeholder="0"
            error={errors.price?.message}
            {...register("price", { required: "Price is required", min: { value: 0, message: "Must be positive" } })} />
          <Input label="Discount Price (৳)" type="number" min={0} placeholder="0 (optional)"
            {...register("discountPrice")} />
          <Input label="Stock *" type="number" min={0} placeholder="0"
            error={errors.stock?.message}
            {...register("stock", { required: "Stock is required", min: { value: 0, message: "Must be 0 or more" } })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="SKU (optional)" placeholder="e.g. APPLE-IP15-BLK"
            {...register("sku")} />
          <Input label="Low Stock Alert Threshold" type="number" min={1} placeholder="5"
            {...register("lowStockThreshold")} />
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Shipping</h2>
        <div className="flex items-center gap-3 mb-2">
          <input type="checkbox" id="freeShip" {...register("shipping.isFreeShipping")} className="w-4 h-4 rounded text-teal-600" />
          <label htmlFor="freeShip" className="text-sm font-medium text-gray-700">Free Shipping</label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input label="Weight (kg)" type="number" step="0.1" placeholder="0.5" {...register("shipping.weight")} />
          <Input label="Length (cm)" type="number" placeholder="0" {...register("shipping.dimensions.length")} />
          <Input label="Width (cm)"  type="number" placeholder="0" {...register("shipping.dimensions.width")}  />
          <Input label="Height (cm)" type="number" placeholder="0" {...register("shipping.dimensions.height")} />
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Product Images</h2>
        <p className="text-xs text-gray-400">Upload up to 5 images. First image will be the cover.</p>

        {/* Preview grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {previews.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image src={img.url} alt="" fill className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-teal-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">Cover</span>
                )}
                <button type="button" onClick={() => removeImage(i, img)}
                  className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {previews.length < 5 && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={handleFileChange} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-center hover:border-teal-400 hover:bg-teal-50 transition-all group">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📸</span>
              <p className="text-sm font-medium text-gray-600">Click to upload images</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 5MB each</p>
            </button>
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">SEO (optional)</h2>
        <Input label="Meta Title" placeholder="Leave empty to use product name" {...register("metaTitle")} />
        <Textarea label="Meta Description" rows={2} placeholder="Brief description for search engines..."
          {...register("metaDescription")} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button type="submit" variant="vendor" size="lg" loading={loading}>
          {mode === "create" ? "Submit for Approval" : "Save Changes"}
        </Button>
        <Button type="submit" variant="secondary" size="lg" loading={loading}
          onClick={() => { document.activeElement?.form?.querySelector('[name="saveDraft"]')?.click(); }}
          formNoValidate>
          Save as Draft
        </Button>
        <input type="hidden" name="saveDraft" value="false" />
      </div>
    </form>
  );
}