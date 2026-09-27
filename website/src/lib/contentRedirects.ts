/**
 * Duplicate content pages merged into their stronger twin with a 301
 * (website/seo-report.md §d, owner-approved 2026-09-27: Tier 1 + Java
 * garbage-collector). The list lives in contentRedirects.json so next.config.js
 * (which serves the 301s) and the app code read the same data: a redirected
 * source must never be listed in a sitemap or offered as a related link.
 *
 * Exact paths only — no patterns — so a path can be checked with a Set lookup.
 * The source rows still exist in the database (mobile keeps showing them);
 * the website never renders them because the redirect runs before routing.
 */
import redirects from "./contentRedirects.json";

export type ContentRedirect = { source: string; destination: string };

export const CONTENT_REDIRECTS: readonly ContentRedirect[] = redirects;

const SOURCES = new Set(CONTENT_REDIRECTS.map((r) => r.source));

/** True when `path` (e.g. "/learning/java-tutorial/garbage-collector") 301s elsewhere. */
export function isRedirectedPath(path: string): boolean {
  return SOURCES.has(path);
}
