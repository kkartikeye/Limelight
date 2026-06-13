import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limelight.news";

// Country/article pages are intentionally omitted: they're driven by a 30-day
// rolling window of live data, so indexing them would churn constantly.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`,           lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/regions`,    lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/topics`,     lastModified: now, changeFrequency: "daily",  priority: 0.7 },
    { url: `${SITE_URL}/about`,      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/developers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
