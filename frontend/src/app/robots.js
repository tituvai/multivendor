// Next.js 16 Robots.txt configuration
export default function robots() {
  const baseUrl = "https://maltivendor.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/vendor/",
        "/profile/",
        "/checkout/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
