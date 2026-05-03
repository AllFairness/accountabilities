import { MetadataRoute } from "next";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ProfRow { id: number; }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://accountabilities.org";

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/professionals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/trials`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // professionals/[id] を動的生成
  const rows = await query<ProfRow>("SELECT id FROM professionals ORDER BY id");
  const professionalPages: MetadataRoute.Sitemap = rows.map(r => ({
    url: `${base}/professionals/${r.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...professionalPages];
}
