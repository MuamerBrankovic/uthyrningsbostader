import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://reloka.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nu = new Date();

  const statiska: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,            lastModified: nu, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/bostader`,    lastModified: nu, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/offert`,      lastModified: nu, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/hyresvardar`, lastModified: nu, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/om-oss`,      lastModified: nu, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/faq`,         lastModified: nu, changeFrequency: "monthly", priority: 0.5 },
  ];

  let bostadEntries: MetadataRoute.Sitemap = [];
  let rumEntries: MetadataRoute.Sitemap = [];

  try {
    const bostader = await prisma.bostad.findMany({
      select: {
        id: true,
        created_at: true,
        rum: { select: { id: true, created_at: true } },
      },
    });

    bostadEntries = bostader.map((b) => ({
      url: `${BASE_URL}/bostad/${b.id}`,
      lastModified: b.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    rumEntries = bostader.flatMap((b) =>
      b.rum.map((r) => ({
        url: `${BASE_URL}/rum/${r.id}`,
        lastModified: r.created_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );
  } catch (err) {
    console.error("[sitemap] Kunde inte hämta bostäder/rum:", err);
  }

  return [...statiska, ...bostadEntries, ...rumEntries];
}
