import type { MetadataRoute } from "next";

const SITE_URL = "https://seo-report-tool-pi.vercel.app";

// Build-time sitemap. Only public, indexable pages — /results, /presentation,
// /seo-offer, /compare are query-driven views and not useful to Google
// without a URL. If we add static blog posts later, list them here too.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
