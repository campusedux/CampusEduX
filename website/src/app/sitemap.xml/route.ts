import { sitemapIndexResponse } from "@/lib/sitemap/response";

// Sitemap index with hourly cached section data. Existing revalidation tags
// refresh the index and children; HTTP rendering stays independent of builds.
export const revalidate = 3600;
// Render on request; cached section reads remain hourly. Backend outages cannot fail prerender.
export const dynamic = "force-dynamic";

export function GET() {
  return sitemapIndexResponse();
}
