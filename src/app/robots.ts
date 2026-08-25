import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dallasdetailz.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/confirm"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
