import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Private / utility paths only. robots.txt rules are PREFIX matches, so every
 * entry must not be a prefix of a public route: a bare "/r" used to also block
 * /resume, /resume/templates, /referral and /refund-policy — the referral
 * token redirect lives under "/r/" only.
 */
export const ROBOTS_DISALLOW = [
  "/account",
  "/auth/",
  "/api/",
  "/admin",
  "/search",
  "/r/",
  "/practice/submissions",
  "/custom-projects/start",
  "/custom-projects/features",
  "/custom-projects/estimate",
  "/custom-projects/checkout",
  "/custom-projects/my-projects",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROBOTS_DISALLOW,
    },
    // Sitemap index; it links every child sitemap under /sitemaps/.
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
