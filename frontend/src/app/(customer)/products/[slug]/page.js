import React from "react";
import axios from "axios";
import ProductDetailClient from "@/components/customer/ProductDetailClient";

// Helper to resolve backend endpoint base path
const getApiUrl = () => {
  return process.env.NODE_ENV === "production"
    ? "https://multivendor-ybbe.onrender.com/api/v1"
    : "http://localhost:5000/api/v1";
};

// Dynamic SEO metadata generation using Server Component lifecycle
export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const res = await axios.get(`${getApiUrl()}/products/${slug}`);
    const product = res.data.data;
    
    const title = `${product.name} | MaltiVendor Marketplace`;
    const description = product.shortDescription || product.description?.slice(0, 160) || "";
    const mainImg = product.images?.[0]?.url || "";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "music.song", // general website/product is standard
        url: `https://maltivendor.com/products/${slug}`,
        images: mainImg ? [{ url: mainImg, width: 800, height: 600, alt: product.name }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: mainImg ? [mainImg] : [],
      },
      alternates: {
        canonical: `https://maltivendor.com/products/${slug}`,
      },
    };
  } catch (e) {
    return {
      title: "Product Details | MaltiVendor",
      description: "Browse product catalog on MaltiVendor Marketplace",
    };
  }
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  
  let product = null;
  let related = [];
  
  try {
    const res = await axios.get(`${getApiUrl()}/products/${slug}`);
    product = res.data.data;
    related = product.related || [];
  } catch (err) {
    return (
      <div className="text-center py-24 bg-white dark:bg-slate-900 border rounded-2xl p-6">
        <span className="text-5xl block mb-3">⚠️</span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">
          This product might be archived, suspended, or does not exist.
        </p>
      </div>
    );
  }

  // Inject Google JSON-LD Structured Data for high Google Search index compatibility
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map((img) => img.url),
    "description": product.shortDescription || product.description?.slice(0, 160),
    "sku": product.sku || product._id,
    "brand": {
      "@type": "Brand",
      "name": product.vendor?.vendorInfo?.shopName || "MaltiVendor Seller",
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "BDT",
      "price": product.discountPrice > 0 ? product.discountPrice : product.price,
      "availability":
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      {/* JSON-LD Script tag in header */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
