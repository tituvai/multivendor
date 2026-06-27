// Next.js 16 Dynamic Sitemap Generator
export default async function sitemap() {
  const baseUrl = "https://maltivendor.com";

  // Core static paths
  const staticPaths = [
    "",
    "/products",
    "/cart",
    "/wishlist",
    "/profile",
    "/auth/login",
    "/auth/register",
    "/vendor/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));

  // In production, we can dynamically append active products/categories
  // const res = await fetch(`${getApiUrl()}/products?limit=100`);
  // const products = await res.json();
  // const productPaths = products.data.map(p => ({ url: `${baseUrl}/products/${p.slug}`, ... }))

  return [...staticPaths];
}
