import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/server";
import type {
  LearningGridCard,
  LearningGridBrief,
  LearningTree,
  LearningTopicPage,
  LearningSearchHit,
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
} from "@/lib/learning.types";
export { firstTopicOf, flattenTopics, isContentGrid, GRID_TYPE_LABEL } from "@/lib/learning.types";

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

// ---------------------------------------------------------------------------
// Specialised (typed) grid catalogs — read the canonical practice tables,
// scoped by `learning_grid_id` (migration 0044/021). Every table has an RLS
// SELECT policy (migration 0045/022) that hides draft / premium / targeted
// rows from the anon client, so nothing here re-checks visibility.
// ---------------------------------------------------------------------------
export const getGridDsaCatalog = cache(async (gridId: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("dsa_topics")
    .select("id,name,slug,sort_order,dsa_problems(id,difficulty)")
    .eq("learning_grid_id", gridId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((t: any) => ({
    id: t.id as string,
    name: t.name as string,
    slug: (t.slug ?? null) as string | null,
    problems: (t.dsa_problems ?? []).length as number,
    byDifficulty: countBy((t.dsa_problems ?? []).map((p: any) => p.difficulty)),
  }));
});

export const getGridMockTests = cache(async (gridId: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("practice_tests")
    .select("id,title,category,question_count,duration_minutes,is_premium")
    .eq("learning_grid_id", gridId)
    .order("created_at", { ascending: false })
    .limit(60);
  return (data ?? []) as {
    id: string;
    title: string;
    category: string;
    question_count: number;
    duration_minutes: number;
    is_premium: boolean;
  }[];
});

export const getGridHrCatalog = cache(async (gridId: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hr_questions")
    .select("category")
    .eq("learning_grid_id", gridId)
    .limit(2000);
  const counts = countBy((data ?? []).map((r: any) => r.category || "General"));
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
});

export const getGridCompanies = cache(async (gridId: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("learning_grid_companies")
    .select("id,headline,sort_order,company:companies(id,name,logo_url)")
    .eq("grid_id", gridId)
    .eq("status", "published")
    .eq("show_on_website", true)
    .order("sort_order", { ascending: true });
  return (data ?? [])
    .filter((r: any) => r.company)
    .map((r: any) => ({
      id: r.company.id as string,
      name: r.company.name as string,
      logoUrl: (r.company.logo_url ?? null) as string | null,
      headline: (r.headline ?? "") as string,
    }));
});

function countBy(values: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const v of values) m[v] = (m[v] ?? 0) + 1;
  return m;
}

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
