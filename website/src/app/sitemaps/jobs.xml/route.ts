import { sitemapSectionResponse } from "@/lib/sitemap/response";

// Child sitemap listed by /sitemap.xml (see src/lib/sitemap/build.ts).
export const revalidate = 3600;
// Render on request; cached section reads remain hourly. Backend outages cannot fail prerender.
export const dynamic = "force-dynamic";

export function GET() {
  return sitemapSectionResponse("jobs");
}
