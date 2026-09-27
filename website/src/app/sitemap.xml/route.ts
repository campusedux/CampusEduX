import { sitemapIndexResponse } from "@/lib/sitemap/response";

// Sitemap INDEX (Next 14.2's `generateSitemaps` can't emit one). Children live
// under /sitemaps/<section>.xml — see src/lib/sitemap/build.ts. Re-generated at
// most hourly; POST /api/revalidate {"tags":["learning:sitemap"]} (which also
// revalidates this path) refreshes it and every child on demand.
export const revalidate = 3600;

export function GET() {
  return sitemapIndexResponse();
}
