/**
 * Content-quality classification shared by page-level metadata (per-page
 * noindex) and sitemap generation (exclusion), so the two never drift apart —
 * a page that decides not to index itself must not still be promoted through
 * `sitemap.xml`.
 *
 * `GENERATIVE_AI_TEMPLATE_MARKERS` are two verbatim phrases confirmed (by
 * direct inspection of `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql`)
 * to be mail-merge filler repeated across 206 of the Generative AI tutorial's
 * 207 seeded topics regardless of the topic's actual subject — and confirmed
 * (via repo-wide grep) to appear in no other tutorial's seed content. The one
 * topic that doesn't contain them ("Course Summary & Project Roadmap") is
 * genuinely original synthesis and is deliberately left indexable by this
 * check.
 */
const GENERATIVE_AI_TEMPLATE_MARKERS = [
  "The important lesson is that the technique is a component of a larger system",
  "Suppose a student is building an AI learning assistant",
];

export function isTemplatedGenerativeAiBody(bodyText: string): boolean {
  return GENERATIVE_AI_TEMPLATE_MARKERS.every((marker) => bodyText.includes(marker));
}

/** Mirrors the coding-problem page's own `isThin` metadata check (locked/
 *  premium problems stay indexable as a teaser, same convention as Learning
 *  topics) — used by the sitemap so it never lists a page that page's own
 *  `generateMetadata` would mark `noindex`. */
export function isThinCodingProblemRow(row: {
  is_premium?: boolean | null;
  examples?: unknown[] | null;
  constraints?: unknown[] | null;
  starter_code?: Record<string, unknown> | null;
}): boolean {
  if (row.is_premium) return false;
  return (
    (row.examples?.length ?? 0) === 0 &&
    (row.constraints?.length ?? 0) === 0 &&
    Object.keys(row.starter_code ?? {}).length === 0
  );
}
