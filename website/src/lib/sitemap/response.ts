import { SITE_URL } from "@/lib/seo";
import { renderSitemapIndex, renderUrlset, type SitemapSection } from "./build";
import { getSitemapIndexEntries, getSitemapSectionEntries } from "./data";

const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8" };

function unavailable(): Response {
  // Do not turn an outage into a cached, successful empty catalog.
  return new Response("Sitemap temporarily unavailable. Please retry.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60", "Cache-Control": "no-store" },
  });
}

/** GET body of `/sitemap.xml` — a sitemap index of the child sitemaps. */
export async function sitemapIndexResponse(): Promise<Response> {
  try {
    return new Response(renderSitemapIndex(SITE_URL, await getSitemapIndexEntries()), { headers: XML_HEADERS });
  } catch {
    return unavailable();
  }
}

/** GET body of `/sitemaps/<section>.xml`. */
export async function sitemapSectionResponse(section: SitemapSection): Promise<Response> {
  try {
    return new Response(renderUrlset(SITE_URL, await getSitemapSectionEntries(section)), { headers: XML_HEADERS });
  } catch {
    return unavailable();
  }
}
