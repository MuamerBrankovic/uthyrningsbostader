import type { MetadataRoute } from "next";

// Samma BASE_URL som i app/sitemap.ts
const BASE_URL = "https://reloka.se";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/logga-in", "/registrera"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
