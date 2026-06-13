"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { productAPI } from "@/services/api";
import toast from "react-hot-toast";


import Link from "next/link";
import ProductForm from "@/components/ProductForm";

export default function AddProductPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await productAPI.create(formData);
      toast.success("Product submitted for approval!");
      router.push("/vendor/products");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/vendor/products" className="text-sm text-teal-600 hover:underline">← Back to Products</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Add New Product</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details below. Your product will be reviewed by admin before going live.</p>
      </div>
      <ProductForm onSubmit={handleSubmit} loading={loading} mode="create" />
    </div>
  );
}