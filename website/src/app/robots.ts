import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.campusedux.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/account/",
        "/auth",
        "/api",
        "/admin",
        "/search",
        "/custom-projects/start",
        "/custom-projects/features",
        "/custom-projects/estimate",
        "/custom-projects/checkout",
        "/custom-projects/my-projects",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
