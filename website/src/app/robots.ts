import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Private / utility paths only. robots.txt rules are PREFIX matches, so every
 * entry must not be a prefix of a public route: a bare "/r" used to also block
 * /resume, /resume/templates, /referral and /refund-policy — the referral
 * private resume share-token route lives under "/r/" only.
 */
export const ROBOTS_DISALLOW = [
  "/account",
  "/auth/",
  "/api/",
  "/admin",
  "/r/",
  "/practice/submissions",
  "/custom-projects/start",
  "/custom-projects/features",
  "/custom-projects/estimate",
  "/custom-projects/checkout",
  "/custom-projects/my-projects",
];

// Owner decision (2026-11-03): preserve training access. The wildcard also allows
// search/citation crawlers on public content with the same private-path exclusions.
// See docs/seo/10-crawler-policy.md; change this policy here when requested.
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
