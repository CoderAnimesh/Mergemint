import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_APP_URL || "https://app.shiplog.dev";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/docs", "/acme-cloud/changelog", "/acme-cloud/roadmap"],
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

