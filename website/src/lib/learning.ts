import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cachedPublicRead, RpcFailed } from "@/lib/publicCache";
import { LEARNING_LEAF_REVALIDATE, LEARNING_SHARED_REVALIDATE, learningTag } from "@/lib/learningTags";
import { getPublicSupabase } from "@/lib/supabase/server";
import { onlyActiveJobs } from "@/lib/jobsActive";
import { arrayMatchVariants } from "@/lib/searchModel";
import { JOB_LIST_FIELDS, PROJECT_LIST_FIELDS } from "@/lib/marketplace";
import { gridTechProfile, mergeUniqueById, rankTutorials } from "@/lib/learningDiscovery";
import type { ProjectCardData } from "@/components/ProjectCard";
import type { JobCardData } from "@/components/JobCard";
import type {
  LearningGridCard,
  LearningGridBrief,
  LearningTree,
  LearningTopicPage,
  LearningSearchHit,
  TopicPractice,
  CodingProblemDetail,
  CodingProblemRelated,
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
  CodingProblemRelated,
  RelatedProblemCard,
  AdjacentProblem,
  MockTestDetail,
} from "@/lib/learning.types";
export { flattenTopics } from "@/lib/learning.types";

const PLATFORM = "website";

// Per-topic / per-problem entries (read once per page regeneration) get the leaf TTL.
const LEAF_KEYS = new Set(["learning:topic", "learning:topic-practice", "learning:coding-problem", "learning:coding-related"]);

/** Learning-flavoured `cachedPublicRead`: adds the coarse `learning` tag and picks the TTL by key. */
function cachedRead<A extends string[], R>(
  key: string,
  args: A,
  tags: string[],
  read: (...a: A) => Promise<R>,
  fallback: R,
): Promise<R> {
  const ttl = LEAF_KEYS.has(key) ? LEARNING_LEAF_REVALIDATE : LEARNING_SHARED_REVALIDATE;
  return cachedPublicRead(key, args, ["learning", ...tags], ttl, read, fallback);
}


export const getLearningGrids = cache(async (): Promise<LearningGridCard[]> =>
  cachedRead("learning:grids", [] as [], [learningTag.list], async () => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("learning_grids_list", { p_platform: PLATFORM });
    if (error || !Array.isArray(data)) throw new RpcFailed();
    return data as LearningGridCard[];
  }, []),
);

export const getLearningTree = cache(async (gridSlug: string): Promise<LearningTree | null> =>
  cachedRead("learning:tree", [gridSlug], [learningTag.grid(gridSlug)], async (g) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("learning_tree", { p_grid_slug: g, p_platform: PLATFORM });
    if (error) throw new RpcFailed();
    return (data || null) as LearningTree | null;
  }, null),
);

export const getLearningTopicPage = cache(
  async (gridSlug: string, topicSlug: string): Promise<LearningTopicPage | null> =>
    cachedRead(
      "learning:topic",
      [gridSlug, topicSlug],
      [learningTag.grid(gridSlug), learningTag.topic(gridSlug, topicSlug)],
      async (g, t) => {
        const supabase = getPublicSupabase();
        if (!supabase) return null;
        const { data, error } = await supabase.rpc("learning_topic_content", {
          p_grid_slug: g,
          p_topic_slug: t,
          p_platform: PLATFORM,
        });
        if (error) throw new RpcFailed();
        return (data || null) as LearningTopicPage | null;
      },
      null,
    ),
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
    return cachedRead(
      "learning:topic-practice",
      [gridSlug, topicSlug],
      [learningTag.grid(gridSlug), learningTag.topic(gridSlug, topicSlug)],
      async (g, t) => {
        const supabase = getPublicSupabase();
        if (!supabase) return empty;
        const { data, error } = await supabase.rpc("learning_topic_practice", {
          p_grid_slug: g,
          p_topic_slug: t,
          p_platform: PLATFORM,
        });
        if (error) throw new RpcFailed();
        const payload = (data ?? {}) as Partial<TopicPractice>;
        return {
          mock_tests: Array.isArray(payload.mock_tests) ? payload.mock_tests : [],
          coding_problems: Array.isArray(payload.coding_problems) ? payload.coding_problems : [],
        };
      },
      empty,
    );
  },
);

// ---------------------------------------------------------------------------
// Bottom-of-topic content discovery — "Other Tutorials", "Related Projects",
// "Related Jobs", "Latest Jobs", "Other Learning Topics". ONE cross-request
// cache entry per grid (tags: learning / projects / jobs, so an admin edit +
// `POST /api/revalidate` refreshes it) wrapping a SINGLE `Promise.all` of four
// BOUNDED, explicit-column reads. Every table hit is anon on an RLS
// `using (true)` catalog table (projects / jobs) or the already
// visibility-filtered `learning_grids_list` RPC — nothing draft / private /
// premium-gated can surface here.
// ---------------------------------------------------------------------------

export interface TopicDiscoveryData {
  /** Technology label derived from the grid ("Java", "AI/ML"…) — heading copy. */
  techLabel: string;
  /** Up to 6 OTHER published grids, ranked (featured → topic count → order). */
  tutorials: LearningGridCard[];
  /** Ranked grids beyond the first 6 — a compact tail for "Other Learning Topics". */
  overflowTutorials: { slug: string; name: string }[];
  relatedProjects: ProjectCardData[];
  relatedJobs: JobCardData[];
  latestJobs: JobCardData[];
}

const EMPTY_DISCOVERY: Omit<TopicDiscoveryData, "techLabel"> = {
  tutorials: [],
  overflowTutorials: [],
  relatedProjects: [],
  relatedJobs: [],
  latestJobs: [],
};

const DISCOVERY_TUTORIAL_LIMIT = 6;
const DISCOVERY_CARD_LIMIT = 6;
/** Below this many tech matches, top up from popular / latest so a section
 *  still has enough to be worth showing (never with fabricated rows). */
const DISCOVERY_MIN_RELEVANT = 3;

export const getTopicDiscovery = unstable_cache(
  async (gridSlug: string, gridName: string): Promise<TopicDiscoveryData> => {
    const { label, terms } = gridTechProfile(gridSlug, gridName);
    const supabase = getPublicSupabase();
    if (!supabase) return { techLabel: label, ...EMPTY_DISCOVERY };

    const variants = Array.from(new Set(terms.flatMap(arrayMatchVariants)));

    try {
      const [gridsRes, projByTechRes, jobsBySkillRes, latestJobsRes] = await Promise.all([
        supabase.rpc("learning_grids_list", { p_platform: PLATFORM }),
        supabase
          .from("projects")
          .select(PROJECT_LIST_FIELDS)
          .overlaps("tech_stack", variants)
          .order("sales_count", { ascending: false })
          .limit(DISCOVERY_CARD_LIMIT),
        onlyActiveJobs(supabase.from("jobs").select(JOB_LIST_FIELDS))
          .overlaps("skills", variants)
          .order("posted_at", { ascending: false })
          .limit(DISCOVERY_CARD_LIMIT),
        onlyActiveJobs(supabase.from("jobs").select(JOB_LIST_FIELDS))
          .order("posted_at", { ascending: false })
          .limit(DISCOVERY_CARD_LIMIT + 3),
      ]);

      // --- Other Tutorials — every other published grid, ranked -----------
      const others = (Array.isArray(gridsRes.data) ? (gridsRes.data as LearningGridCard[]) : []).filter(
        (g) => g.slug && g.slug.toLowerCase() !== gridSlug.toLowerCase(),
      );
      const ranked = rankTutorials(others);
      const tutorials = ranked.slice(0, DISCOVERY_TUTORIAL_LIMIT);
      const overflowTutorials = ranked
        .slice(DISCOVERY_TUTORIAL_LIMIT)
        .map((g) => ({ slug: g.slug, name: g.name }));

      // --- Related Projects — tech match, topped up with popular ----------
      let relatedProjects = (projByTechRes.data ?? []) as ProjectCardData[];
      if (relatedProjects.length < DISCOVERY_MIN_RELEVANT) {
        const { data: popular } = await supabase
          .from("projects")
          .select(PROJECT_LIST_FIELDS)
          .order("sales_count", { ascending: false })
          .limit(DISCOVERY_CARD_LIMIT);
        relatedProjects = mergeUniqueById(
          relatedProjects,
          (popular ?? []) as ProjectCardData[],
          DISCOVERY_CARD_LIMIT,
        );
      }

      // --- Related Jobs — skill match, topped up with the latest pool -----
      const latestPool = (latestJobsRes.data ?? []) as JobCardData[];
      let relatedJobs = (jobsBySkillRes.data ?? []) as JobCardData[];
      if (relatedJobs.length < DISCOVERY_MIN_RELEVANT) {
        relatedJobs = mergeUniqueById(relatedJobs, latestPool, DISCOVERY_CARD_LIMIT);
      }

      // --- Latest Jobs — newest, minus anything already shown as related --
      const shownJobIds = new Set(relatedJobs.map((j) => j.id));
      const latestJobs = latestPool.filter((j) => !shownJobIds.has(j.id)).slice(0, DISCOVERY_CARD_LIMIT);

      return { techLabel: label, tutorials, overflowTutorials, relatedProjects, relatedJobs, latestJobs };
    } catch {
      return { techLabel: label, ...EMPTY_DISCOVERY };
    }
  },
  ["learning:topic-discovery"],
  { revalidate: 300, tags: ["learning", learningTag.list, "projects", "jobs"] },
);

/** One topic Coding Problem by its global slug, for `/coding-problems/<slug>`.
 *  `coding_problem_detail` (0048/025) withholds the body / examples / hints /
 *  editorial when the caller can't open a premium problem (`locked: true`), and
 *  NEVER returns the hidden judge test cases. */
export const getCodingProblem = cache(async (slug: string): Promise<CodingProblemDetail | null> =>
  cachedRead("learning:coding-problem", [slug], [learningTag.coding(slug)], async (sl) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("coding_problem_detail", { p_slug: sl, p_platform: PLATFORM });
    if (error) throw new RpcFailed();
    return (data || null) as CodingProblemDetail | null;
  }, null),
);

/** Up to 3 related coding problems (same topic, topped up from sibling topics
 *  in the same grid when the topic itself doesn't have 3) plus prev/next
 *  problem within the same topic, for a topic-scoped coding problem —
 *  `coding_problem_related()` (migration 0102/074). Powers the internal-
 *  linking "Related Problems" section + prev/next nav on `/coding-problems/*`. */
export const getCodingProblemRelated = cache(async (slug: string): Promise<CodingProblemRelated | null> =>
  cachedRead("learning:coding-related", [slug], [learningTag.coding(slug)], async (sl) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("coding_problem_related", { p_slug: sl, p_platform: PLATFORM });
    if (error) throw new RpcFailed();
    return (data || null) as CodingProblemRelated | null;
  }, null),
);

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

/** Chapter-wise / full-course randomized tests for a grid (0091/063's
 *  `scope='chapter'|'course'` practice_tests rows) — a course test (if any)
 *  plus a section_id -> chapter test lookup, for the grid page's "Chapter
 *  Test" / "Full Course Test" links. Empty for grids that don't have any
 *  (every grid except dbms-sql-tutorial, today). */
export interface GridScopedTests {
  courseTest: { id: string; title: string } | null;
  chapterTestBySectionId: Record<string, { id: string; title: string }>;
}
export const getGridScopedTests = cache(async (gridId: string): Promise<GridScopedTests> => {
  const supabase = getPublicSupabase();
  if (!supabase) return { courseTest: null, chapterTestBySectionId: {} };

  const [{ data: courseRows }, { data: chapterRows }] = await Promise.all([
    supabase
      .from("practice_tests")
      .select("id,title")
      .eq("scope", "course")
      .eq("learning_grid_id_scope", gridId)
      .eq("status", "published")
      .eq("show_on_website", true)
      .limit(1),
    supabase
      .from("practice_tests")
      .select("id,title,learning_section_id,learning_sections!inner(grid_id)")
      .eq("scope", "chapter")
      .eq("learning_sections.grid_id", gridId)
      .eq("status", "published")
      .eq("show_on_website", true),
  ]);

  const courseTest = courseRows?.[0] ? { id: courseRows[0].id as string, title: courseRows[0].title as string } : null;
  const chapterTestBySectionId: Record<string, { id: string; title: string }> = {};
  for (const r of (chapterRows ?? []) as { id: string; title: string; learning_section_id: string | null }[]) {
    if (r.learning_section_id) chapterTestBySectionId[r.learning_section_id] = { id: r.id, title: r.title };
  }
  return { courseTest, chapterTestBySectionId };
});

/** Lightweight grid header — one row, no tree. RLS on `learning_grids`
 *  (migration 0045/022) already restricts anon to published + global +
 *  website-visible, so an unpublished / archived / targeted grid comes back
 *  null and the page 404s. */
export const getLearningGridBrief = cache(async (slug: string): Promise<LearningGridBrief | null> =>
  cachedRead("learning:grid-brief", [slug], [learningTag.grid(slug)], async (sl) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("learning_grids")
      .select("id,name,slug,description,grid_type,is_premium,icon,cover_image_url,accent_color")
      .ilike("slug", sl)
      .eq("status", "published")
      .eq("show_on_website", true)
      .maybeSingle();
    if (error) throw new RpcFailed();
    return (data || null) as LearningGridBrief | null;
  }, null),
);

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
  { revalidate: LEARNING_SHARED_REVALIDATE, tags: ["learning", learningTag.list, learningTag.sitemap] },
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
  { revalidate: LEARNING_SHARED_REVALIDATE, tags: ["learning", learningTag.list, learningTag.sitemap] },
);

export const getCodingProblemSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.rpc("coding_problems_sitemap", { p_platform: PLATFORM });
    return ((data ?? []) as { slug: string }[]).map((r) => r.slug).filter(Boolean);
  },
  ["learning:coding-problem-slugs"],
  { revalidate: LEARNING_SHARED_REVALIDATE, tags: ["learning", learningTag.sitemap] },
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
