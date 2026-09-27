import { SITE_URL } from "@/lib/seo";
import { renderSitemapIndex, renderUrlset, type SitemapSection } from "./build";
import { getSitemapIndexEntries, getSitemapSectionEntries } from "./data";

const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8" };

/** GET body of `/sitemap.xml` — a sitemap index of the child sitemaps. */
export async function sitemapIndexResponse(): Promise<Response> {
  return new Response(renderSitemapIndex(SITE_URL, await getSitemapIndexEntries()), { headers: XML_HEADERS });
}

/** GET body of `/sitemaps/<section>.xml`. */
export async function sitemapSectionResponse(section: SitemapSection): Promise<Response> {
  return new Response(renderUrlset(SITE_URL, await getSitemapSectionEntries(section)), { headers: XML_HEADERS });
}
