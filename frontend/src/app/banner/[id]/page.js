"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { bannerAPI } from "@/services/api";
import { useGetProductsQuery } from "@/redux/slices/productsApi";
import ProductCard from "@/components/customer/ProductCard";
import { Spinner, SectionHeader, ProductGrid } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import API from "@/services/axios";

export default function BannerDetailPage() {
  const { id } = useParams();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery(
    banner?.category?.slug ? { category: banner.category.slug, limit: 20 } : { skip: true }
  );

  const products = productsRes?.data || [];

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await API.get(`/banners/${id}`);
        setBanner(res.data.data);
      } catch (error) {
        console.error("Failed to fetch banner", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Banner not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Banner Image */}
      <div className="relative rounded-3xl overflow-hidden h-[300px] sm:h-[400px]">
        {banner.image?.url ? (
          <img
            src={banner.image.url}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent" />
        )}
      </div>

      {/* Category Products */}
      <div className="space-y-5">
        <SectionHeader
          title={banner.category?.name || "Category Products"}
          subtitle={`Products from ${banner.category?.name || "this category"}`}
        />
        {productsLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No products found in this category</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
