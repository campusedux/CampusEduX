import { NextResponse } from "next/server";
import { runGlobalSearch, SUGGEST_LIMIT } from "@/lib/search";
import { sanitizeSearchTerm, isSearchableTerm } from "@/lib/searchModel";

/**
 * Typeahead feed for the navbar search island — `GET /api/search?q=<term>`.
 *
 * Returns the same grouped shape as the `/search` page (`GlobalSearchResult`)
 * but with only `SUGGEST_LIMIT` rows per content type. Public catalog data
 * only; the underlying reads are RLS-gated and identical for every visitor, so
 * the response is CDN-cacheable and additionally memoised by `runGlobalSearch`'s
 * `unstable_cache` layer.
 */

// Reads the query string on every request that misses the CDN; the cache
// wrapper in `src/lib/search.ts` keeps that to one DB pass per term / window.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const term = sanitizeSearchTerm(new URL(req.url).searchParams.get("q"));

  if (!isSearchableTerm(term)) {
    return NextResponse.json(
      { q: term, groups: [], total: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await runGlobalSearch(term, SUGGEST_LIMIT);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
