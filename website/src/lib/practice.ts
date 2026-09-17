import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import type {
  PracticeCategory,
  PracticeProblemsPage,
  PracticeProblemDetail,
  PracticeQuery,
} from "@/lib/practice.types";
import { PRACTICE_PAGE_SIZE } from "@/lib/practice.types";
import type { CodingProblemRelated } from "@/lib/learning.types";

export type { CodingProblemRelated } from "@/lib/learning.types";

/**
 * Read layer for the global Practice → Coding Problems section. Everything goes
 * through the SECURITY DEFINER RPCs from migration 0072/044
 * (`practice_categories`, `practice_problems_list`, `practice_problem_detail`,
 * `practice_problems_sitemap`), pinned to the `'website'` platform. Those
 * functions enforce published + `show_on_website` + academic targeting + the
 * premium gate and never return hidden `test_cases`, so nothing here re-checks
 * visibility or trusts a UI lock. Mirrors `src/lib/learning.ts`.
 */

const PLATFORM = "website";

export type {
  PracticeCategory,
  PracticeProblemCard,
  PracticeProblemsPage,
  PracticeProblemDetail,
  PracticeQuery,
} from "@/lib/practice.types";

/** All published practice categories + a live problem count. Cross-request
 *  cached (tag `practice`, refreshed by `POST /api/revalidate`). */
export const getPracticeCategories = unstable_cache(
  async (): Promise<PracticeCategory[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("practice_categories", { p_platform: PLATFORM });
    if (error || !Array.isArray(data)) return [];
    return data as PracticeCategory[];
  },
  ["practice-categories"],
  { revalidate: 300, tags: ["practice"] },
);

/** One page of the problem list — server-side filtered + paginated. The browser
 *  never receives the full catalogue or any hidden test case. */
export const getPracticeProblemsPage = cache(
  async (query: PracticeQuery): Promise<PracticeProblemsPage> => {
    const empty: PracticeProblemsPage = { total: 0, items: [] };
    const supabase = getPublicSupabase();
    if (!supabase) return empty;
    const { data, error } = await supabase.rpc("practice_problems_list", {
      p_platform: PLATFORM,
      p_difficulty: query.difficulty ?? null,
      p_category: query.category ?? null,
      p_search: query.q ?? null,
      p_limit: PRACTICE_PAGE_SIZE,
      p_offset: (query.page - 1) * PRACTICE_PAGE_SIZE,
    });
    if (error || !data || typeof data !== "object") return empty;
    const payload = data as Partial<PracticeProblemsPage>;
    const items = Array.isArray(payload.items) ? payload.items : [];
    // `lang` is authored for all 5 languages on every problem, so filtering by it
    // is effectively a no-op — apply it client-side against `supported_languages`
    // to stay correct if a future problem drops a language.
    const filtered = query.lang
      ? items.filter((p) => (p.supported_languages ?? []).includes(query.lang!))
      : items;
    return {
      total: typeof payload.total === "number" ? payload.total : filtered.length,
      items: filtered,
    };
  },
);

/**
 * One practice problem by slug. `practice_problem_detail` (0072/044) withholds
 * the body / examples / hints / starter / editorial / solution for a premium
 * problem the caller can't open and returns `locked: true`. Shaped to satisfy
 * `CodingProblemDetail` (empty `topic` slugs — the workspace is given an
 * explicit breadcrumb), with the practice `category` attached.
 */
export const getPracticeProblem = cache(async (slug: string): Promise<PracticeProblemDetail | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("practice_problem_detail", {
    p_slug: slug,
    p_platform: PLATFORM,
  });
  if (error || !data) return null;
  const payload = data as PracticeProblemDetail;
  return {
    ...payload,
    topic: {
      grid_slug: payload.topic?.grid_slug ?? "",
      topic_slug: payload.topic?.topic_slug ?? "",
      title: payload.category?.name ?? payload.topic?.title ?? "Practice",
    },
  };
});

/** Up to 3 related practice problems (same category) plus prev/next problem
 *  within the same category — `practice_problem_related()` (migration
 *  0102/074). Powers the internal-linking "Related Problems" section +
 *  prev/next nav on `/practice/problems/*`. */
export const getPracticeProblemRelated = cache(async (slug: string): Promise<CodingProblemRelated | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("practice_problem_related", {
    p_slug: slug,
    p_platform: PLATFORM,
  });
  if (error || !data) return null;
  return data as CodingProblemRelated;
});

/** Published, website-visible practice problem slugs + last-modified, for `sitemap.ts`. */
export const getPracticeProblemSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc("practice_problems_sitemap", { p_platform: PLATFORM });
    if (!Array.isArray(data)) return [];
    return data as { slug: string; updated_at: string }[];
  },
  ["practice-problem-slugs"],
  { revalidate: 300, tags: ["practice"] },
);
