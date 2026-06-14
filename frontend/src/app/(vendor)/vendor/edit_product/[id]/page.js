"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { productAPI } from "@/services/api";
import toast from "react-hot-toast";
import { PageLoader, ProductStatusBadge } from "@/components/ui";
import Link from "next/link";
import ProductForm from "@/components/ProductForm";

export default function EditProductPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    productAPI.getMyProducts({ page: 1, limit: 100 })
      .then((r) => {
        const p = r.data.data.find((x) => x._id === id);
        if (p) setProduct(p);
        else toast.error("Product not found");
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await productAPI.update(id, formData);
      toast.success("Product updated successfully!");
      router.push("/vendor/products");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Product not found.</p>
      <Link href="/vendor/products" className="text-teal-600 text-sm mt-2 inline-block hover:underline">← Back</Link>
    </div>
  );

  const defaultValues = {
    name:             product.name,
    description:      product.description,
    shortDescription: product.shortDescription,
    price:            product.price,
    discountPrice:    product.discountPrice,
    stock:            product.stock,
    sku:              product.sku,
    category:         product.category?._id,
    tags:             product.tags?.join(", "),
    images:           product.images,
    metaTitle:        product.metaTitle,
    metaDescription:  product.metaDescription,
    "shipping.isFreeShipping": product.shipping?.isFreeShipping,
    "shipping.shippingCost":   product.shipping?.shippingCost,
    "shipping.weight":         product.shipping?.weight,
    lowStockThreshold: product.lowStockThreshold,
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/vendor/products" className="text-sm text-teal-600 hover:underline">← Back to Products</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-md truncate">{product.name}</p>
        </div>
        <ProductStatusBadge status={product.status} />
      </div>

      {product.status === "rejected" && product.rejectionReason && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-0.5">Rejected by admin</p>
          <p className="text-sm text-red-600">{product.rejectionReason}</p>
          <p className="text-xs text-red-400 mt-1">Fix the issues and re-submit for approval.</p>
        </div>
      )}

      <ProductForm defaultValues={defaultValues} onSubmit={handleSubmit} loading={saving} mode="edit" />
    </div>
  );
}
