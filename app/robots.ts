import type { MetadataRoute } from "next";

// Samma BASE_URL som i app/sitemap.ts — byt vid domänflytt
const BASE_URL = "https://uthyrningsbostader.vercel.app";

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
