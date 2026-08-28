import type { MetadataRoute } from "next";
import { getAnnexControlRoutes, getAnnexThemeRoutes } from "@/content/public-iso27001";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://normcore.io";
  const publicRoutes = [
    { path: "", priority: 1 },
    { path: "/resources", priority: 0.7 },
    { path: "/security", priority: 0.7 },
    { path: "/pricing", priority: 0.6 },
    { path: "/iso-27001/annex-a", priority: 0.8 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    { path: "/cookies", priority: 0.3 },
    { path: "/ai-usage", priority: 0.5 },
    ...getAnnexThemeRoutes().map((theme) => ({ path: `/iso-27001/annex-a/${theme.slug}`, priority: 0.75 })),
    ...getAnnexControlRoutes().map((control) => ({ path: `/iso-27001/annex-a/${control.slug}`, priority: 0.65 })),
  ];

  return publicRoutes.map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
