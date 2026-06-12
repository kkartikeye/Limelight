import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limelight.news";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /saved is per-user localStorage state; /embed is for iframes, not SERPs
      disallow: ["/api/", "/saved", "/embed", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
