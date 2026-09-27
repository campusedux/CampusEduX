import { sitemapSectionResponse } from "@/lib/sitemap/response";

// Child sitemap listed by /sitemap.xml (see src/lib/sitemap/build.ts).
export const revalidate = 3600;

export function GET() {
  return sitemapSectionResponse("interview-questions");
}
