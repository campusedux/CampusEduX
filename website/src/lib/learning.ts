import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import type {
  LearningGridCard,
  LearningGridBrief,
  LearningTree,
  LearningTopicPage,
  LearningSearchHit,
  TopicPractice,
  CodingProblemDetail,
  MockTestDetail,
} from "@/lib/learning.types";

/**
 * Learning read layer for the website. Everything goes through the
 * SECURITY DEFINER RPCs from migration 0042 / 019 (`learning_grids_list`,
 * `learning_tree`, `learning_topic_content`, `learning_search`), all pinned to
 * the `'website'` platform. Those functions enforce the full published +
 * show_on_website chain and the premium gate, so nothing here has to re-check
 * visibility or trust a UI lock. Direct table reads are also RLS-safe, but the
 * RPCs give the whole tree in one round-trip plus prev/next + a `locked` flag.
 */

export type {
  LearningGridCard,
  LearningGridBrief,
  LearningGridType,
  LearningTree,
  LearningTreeSection,
  LearningTreeTopic,
  LearningTopicPage,
  LearningContentBlock,
  LearningSearchHit,
  TopicPractice,
  TopicMockTestCard,
  TopicCodingProblemCard,
  CodingProblemDetail,
  MockTestDetail,
} from "@/lib/learning.types";
export { firstTopicOf, flattenTopics } from "@/lib/learning.types";

const PLATFORM = "website";

export const getLearningGrids = cache(async (): Promise<LearningGridCard[]> => {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("learning_grids_list", { p_platform: PLATFORM });
  if (error || !Array.isArray(data)) return [];
  return data as LearningGridCard[];
});

export const getLearningTree = cache(async (gridSlug: string): Promise<LearningTree | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("learning_tree", {
    p_grid_slug: gridSlug,
    p_platform: PLATFORM,
  });
  if (error || !data) return null;
  return data as LearningTree;
});

export const getLearningTopicPage = cache(
  async (gridSlug: string, topicSlug: string): Promise<LearningTopicPage | null> => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("learning_topic_content", {
      p_grid_slug: gridSlug,
      p_topic_slug: topicSlug,
      p_platform: PLATFORM,
    });
    if (error || !data) return null;
    return data as LearningTopicPage;
  },
);

/**
 * Topic-specific Mock Tests + Coding Problems for the bottom of a topic page.
 * `learning_topic_practice` (migration 0048/025) enforces the same publish +
 * platform + academic-targeting chain as `learning_topic_content` and only
 * lists rows attached to this exact topic. Returns `{ mock_tests: [],
 * coding_problems: [] }` for a topic with no practice — the caller renders
 * nothing in that case.
 */
export const getTopicPractice = cache(
  async (gridSlug: string, topicSlug: string): Promise<TopicPractice> => {
    const empty: TopicPractice = { mock_tests: [], coding_problems: [] };
    const supabase = getPublicSupabase();
    if (!supabase) return empty;
    const { data, error } = await supabase.rpc("learning_topic_practice", {
      p_grid_slug: gridSlug,
      p_topic_slug: topicSlug,
      p_platform: PLATFORM,
    });
    if (error || !data) return empty;
    const payload = data as Partial<TopicPractice>;
    return {
      mock_tests: Array.isArray(payload.mock_tests) ? payload.mock_tests : [],
      coding_problems: Array.isArray(payload.coding_problems) ? payload.coding_problems : [],
    };
  },
);

/** One topic Coding Problem by its global slug, for `/coding-problems/<slug>`.
 *  `coding_problem_detail` (0048/025) withholds the body / examples / hints /
 *  editorial when the caller can't open a premium problem (`locked: true`), and
 *  NEVER returns the hidden judge test cases. */
export const getCodingProblem = cache(async (slug: string): Promise<CodingProblemDetail | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("coding_problem_detail", {
    p_slug: slug,
    p_platform: PLATFORM,
  });
  if (error || !data) return null;
  return data as CodingProblemDetail;
});

/** One topic Mock Test's meta for `/mock-tests/<id>` (instruction card +
 *  breadcrumb). Questions + scoring stay in `test_questions` RLS +
 *  `submit_test_attempt()`. */
export const getMockTest = cache(async (testId: string): Promise<MockTestDetail | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("mock_test_detail", {
    p_test_id: testId,
    p_platform: PLATFORM,
  });
  if (error || !data) return null;
  return data as MockTestDetail;
});

/** Lightweight grid header — one row, no tree. RLS on `learning_grids`
 *  (migration 0045/022) already restricts anon to published + global +
 *  website-visible, so an unpublished / archived / targeted grid comes back
 *  null and the page 404s. */
export const getLearningGridBrief = cache(async (slug: string): Promise<LearningGridBrief | null> => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("learning_grids")
    .select("id,name,slug,description,grid_type,is_premium,icon,cover_image_url,accent_color")
    .ilike("slug", slug)
    .eq("status", "published")
    .eq("show_on_website", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as LearningGridBrief;
});

/**
 * `generateStaticParams` sources. Cross-request cached (`unstable_cache`, tag
 * `learning`) so the build and every on-demand ISR render reuse one round-trip.
 * The `learning_sitemap` / `coding_problems_sitemap` RPCs (migration 0042 /
 * 0048) already return exactly the published + website-visible slugs.
 */
export const getLearningGridSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc("learning_grids_list", { p_platform: PLATFORM });
    return Array.isArray(data) ? (data as LearningGridCard[]).map((g) => g.slug).filter(Boolean) : [];
  },
  ["learning:grid-slugs"],
  { revalidate: 300, tags: ["learning"] },
);

export const getLearningTopicParams = unstable_cache(
  async (): Promise<{ gridSlug: string; topicSlug: string }[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc("learning_sitemap", { p_platform: PLATFORM });
    const rows = (data ?? []) as { grid_slug: string; topic_slug: string | null }[];
    return rows
      .filter((r) => r.grid_slug && r.topic_slug)
      .map((r) => ({ gridSlug: r.grid_slug, topicSlug: r.topic_slug as string }));
  },
  ["learning:topic-params"],
  { revalidate: 300, tags: ["learning"] },
);

export const getCodingProblemSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc("coding_problems_sitemap", { p_platform: PLATFORM });
    return ((data ?? []) as { slug: string }[]).map((r) => r.slug).filter(Boolean);
  },
  ["learning:coding-problem-slugs"],
  { revalidate: 300, tags: ["learning"] },
);

export async function searchLearning(q: string, limit = 20): Promise<LearningSearchHit[]> {
  const term = q.trim();
  if (!term) return [];
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("learning_search", {
    p_q: term,
    p_platform: PLATFORM,
    p_limit: limit,
  });
  if (error || !Array.isArray(data)) return [];
  return data as LearningSearchHit[];
}

/**
 * Resolve a legacy `prep_notes` id to its canonical `/learning/<grid>/<topic>`
 * path, for redirecting old `/placement/notes/<id>` links after the merge
 * (migration 0043/020 adds the `learning_topic_by_source_note` RPC and stamps
 * `learning_topics.source_prep_note_id`). Returns `/learning` when the note has
 * no published Learning topic (draft on import, or the RPC/tables are absent).
 */
export async function resolveLegacyNotePath(noteId: string): Promise<string> {
  const supabase = getPublicSupabase();
  if (!supabase) return "/learning";
  const { data, error } = await supabase.rpc("learning_topic_by_source_note", { p_note_id: noteId });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row?.grid_slug || !row?.topic_slug) return "/learning";
  return `/learning/${row.grid_slug}/${row.topic_slug}`;
}
