import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import { onlyActiveJobs } from "@/lib/jobsActive";
import { learningTag } from "@/lib/learningTags";
import { SITE_URL } from "@/lib/seo";
import { publicReadDeadline } from "@/lib/publicReadDeadline";
import {
  buildBlogEntries,
  buildInterviewEntries,
  buildJobEntries,
  buildLearningEntries,
  buildProblemEntries,
  buildProjectEntries,
  buildStaticEntries,
  GENERATIVE_AI_GRID_SLUG,
  maxLastmod,
  sitemapSectionPath,
  SITEMAP_SECTIONS,
  thinCodingProblemSlugs,
  thinGenerativeAiTopicSlugs,
  type BlogSitemapRow,
  type CodingProblemThinCheckRow,
  type IdDateRow,
  type InterviewSitemapRow,
  type JobSitemapRow,
  type LearningSitemapRow,
  type ProjectSitemapRow,
  type SitemapEntry,
  type SitemapSection,
  type SlugDateRow,
} from "./build";

/**
 * Server-side loaders for the child sitemaps (anon client only — every read
 * here is public, RLS / SECURITY DEFINER RPCs decide visibility).
 *
 * Each section's entries are cached with `unstable_cache` (1 h) and tagged
 * with `learning:sitemap` plus the section's own content tags. So the existing
 * `POST /api/revalidate {"tags":["learning:sitemap"]}` contract still refreshes
 * every sitemap (the index route and each child route consume these entries,
 * and `revalidateTag` also drops the route-cache entries that used them), and
 * an admin save that already sends e.g. `projects` / `blog` refreshes the
 * matching sitemap too.
 *
 * A failed query THROWS (never cached): revalidation retains successful section
 * data; a cold HTTP request gets a retryable 503 instead of a truncated sitemap.
 */

export const SITEMAP_REVALIDATE = 3600;

class SitemapReadFailed extends Error {}

type PageResult = PromiseLike<{ data: unknown; error: unknown }>;

/**
 * Reads every row of an ordered query/RPC in pages. PostgREST caps a single
 * response at the project's `max_rows` (1000 by default), which silently
 * truncates a plain `.limit(2000)`. The next page starts at the number of rows
 * actually received, so a lower server cap can't skip rows either. Stops on an
 * empty page; `maxRows` is a hard safety bound.
 */
export async function readAllPages<T>(
  page: (from: number, to: number) => PageResult,
  { pageSize = 1000, maxRows = 50000 }: { pageSize?: number; maxRows?: number } = {},
): Promise<T[]> {
  const out: T[] = [];
  while (out.length < maxRows) {
    const { data, error } = await publicReadDeadline(() => page(out.length, out.length + pageSize - 1));
    if (error || !Array.isArray(data)) throw new SitemapReadFailed();
    const rows = data as T[];
    if (rows.length === 0) return out;
    out.push(...rows);
  }
  // Never advertise a truncated catalog as a successful complete sitemap.
  throw new SitemapReadFailed("Sitemap read limit reached; add section shards before increasing capacity");
}

type Client = NonNullable<ReturnType<typeof getPublicSupabase>>;

async function loadStatic(supabase: Client): Promise<SitemapEntry[]> {
  // Same row sets /faq and /premium use for their own empty-state noindex.
  const [faqs, plans] = await Promise.all([
    supabase.from("faqs").select("id").eq("status", "active").limit(1),
    supabase.from("premium_plans").select("id").limit(1),
  ]);
  if (faqs.error || plans.error) throw new SitemapReadFailed();
  return buildStaticEntries({
    hasActiveFaqs: (faqs.data?.length ?? 0) > 0,
    hasPremiumPlans: (plans.data?.length ?? 0) > 0,
  });
}

async function loadLearning(supabase: Client): Promise<SitemapEntry[]> {
  const [rows, genAiBodies, topicsWithContent] = await Promise.all([
    readAllPages<LearningSitemapRow>((from, to) =>
      supabase.rpc("learning_sitemap", { p_platform: "website" }).range(from, to),
    ),
    loadGenerativeAiBodies(supabase),
    loadTopicsWithContent(supabase),
  ]);
  return buildLearningEntries(rows, thinGenerativeAiTopicSlugs(genAiBodies), topicsWithContent);
}

/** Public topic IDs with at least one content block, for sitemap exclusion. */
async function loadTopicsWithContent(supabase: Client): Promise<Set<string>> {
  const [grids, topics, contents] = await Promise.all([
    readAllPages<{ id: string; slug: string }>((from, to) => supabase.from("learning_grids").select("id,slug").order("id").range(from, to)),
    readAllPages<{ id: string; slug: string; grid_id: string; is_premium: boolean }>((from, to) => supabase.from("learning_topics").select("id,slug,grid_id,is_premium").order("id").range(from, to)),
    readAllPages<{ topic_id: string }>((from, to) => supabase.from("learning_contents").select("id,topic_id").order("id").range(from, to)),
  ]);
  const gridSlugs = new Map(grids.map((grid) => [grid.id, grid.slug]));
  const topicSlugs = new Map(topics.map((topic) => [topic.id, `${gridSlugs.get(topic.grid_id)}/${topic.slug}`]));
  // Anonymous RLS deliberately hides premium bodies. The page still renders an
  // indexable locked teaser; missing body rows must not classify it as a 404.
  // The website-visible sitemap RPC remains the authority for publication.
  const visibleTopicIds = [...contents.map((content) => content.topic_id), ...topics.filter((topic) => topic.is_premium).map((topic) => topic.id)];
  return new Set(visibleTopicIds.map((id) => topicSlugs.get(id)).filter((slug): slug is string => Boolean(slug)));
}

/** Concatenated content bodies per Generative-AI topic slug (for the templated-content exclusion). */
async function loadGenerativeAiBodies(supabase: Client): Promise<Map<string, string>> {
  const bodies = new Map<string, string>();
  const { data: gridRows, error } = await supabase
    .from("learning_grids")
    .select("id")
    .eq("slug", GENERATIVE_AI_GRID_SLUG)
    .limit(1);
  if (error) throw new SitemapReadFailed();
  const grid = (gridRows as { id: string }[] | null)?.[0];
  if (!grid) return bodies;
  const rows = await readAllPages<{ body: string | null; learning_topics: { slug: string } | null }>((from, to) =>
    supabase
      .from("learning_contents")
      .select("id,body,learning_topics!inner(slug,grid_id)")
      .eq("learning_topics.grid_id", grid.id)
      .order("id")
      .range(from, to),
  );
  for (const row of rows) {
    const slug = row.learning_topics?.slug;
    if (!slug) continue;
    bodies.set(slug, `${bodies.get(slug) ?? ""} ${row.body ?? ""}`);
  }
  return bodies;
}

async function loadProblems(supabase: Client): Promise<SitemapEntry[]> {
  const [coding, thinRows, practice] = await Promise.all([
    readAllPages<SlugDateRow>((from, to) =>
      supabase.rpc("coding_problems_sitemap", { p_platform: "website" }).range(from, to),
    ),
    // Same topic-linked population `coding_problems_sitemap` starts from. A
    // `.in("slug", …)` filter would overflow PostgREST's header limit at this
    // table's size, hence the population query + pagination.
    readAllPages<CodingProblemThinCheckRow>((from, to) =>
      supabase
        .from("dsa_problems")
        .select("id,slug,examples,constraints,starter_code,is_premium")
        .is("topic_id", null)
        .not("learning_topic_id", "is", null)
        .order("id")
        .range(from, to),
    ),
    readAllPages<SlugDateRow>((from, to) =>
      supabase.rpc("practice_problems_sitemap", { p_platform: "website" }).range(from, to),
    ),
  ]);
  return buildProblemEntries(coding, thinCodingProblemSlugs(thinRows), practice);
}

async function loadInterview(supabase: Client): Promise<SitemapEntry[]> {
  const rows = await readAllPages<InterviewSitemapRow>((from, to) =>
    supabase.rpc("interview_questions_sitemap", { p_platform: "website" }).range(from, to),
  );
  const populated: InterviewSitemapRow[] = [];
  // Match the topic page's own published/visible question result. Bound
  // concurrency so sitemap generation does not fan out without limit.
  for (let i = 0; i < rows.length; i += 20) {
    const batch = await Promise.all(rows.slice(i, i + 20).map(async (row) => {
      const { data, error } = await supabase.rpc("interview_topic_detail", {
        p_category_slug: row.category_slug,
        p_topic_slug: row.topic_slug,
        p_platform: "website",
      });
      if (error) throw new SitemapReadFailed();
      return Array.isArray(data?.questions) && data.questions.length > 0 ? row : null;
    }));
    populated.push(...batch.filter((row): row is InterviewSitemapRow => row !== null));
  }
  return buildInterviewEntries(populated);
}

async function loadJobs(supabase: Client): Promise<SitemapEntry[]> {
  const [jobs, companies] = await Promise.all([
    readAllPages<JobSitemapRow>((from, to) =>
      onlyActiveJobs(supabase.from("jobs").select("id,updated_at,company_id")).order("id").range(from, to),
    ),
    readAllPages<IdDateRow>((from, to) =>
      supabase.from("companies").select("id,updated_at").order("id").range(from, to),
    ),
  ]);
  return buildJobEntries(jobs, companies);
}

async function loadProjects(supabase: Client): Promise<SitemapEntry[]> {
  const [projects, categories] = await Promise.all([
    readAllPages<ProjectSitemapRow>((from, to) =>
      supabase.from("projects").select("id,updated_at,category_id").order("id").range(from, to),
    ),
    readAllPages<IdDateRow>((from, to) =>
      supabase.from("categories").select("id,updated_at").order("id").range(from, to),
    ),
  ]);
  return buildProjectEntries(projects, categories);
}

async function loadBlog(supabase: Client): Promise<SitemapEntry[]> {
  // RLS already limits anon to published posts; the status filter is belt-and-braces.
  const posts = await readAllPages<BlogSitemapRow>((from, to) =>
    supabase
      .from("blog_posts")
      .select("slug,updated_at,canonical_url")
      .eq("status", "published")
      .order("slug")
      .range(from, to),
  );
  return buildBlogEntries(posts, SITE_URL);
}

const LOADERS: Record<SitemapSection, { load: (s: Client) => Promise<SitemapEntry[]>; tags: string[] }> = {
  static: { load: loadStatic, tags: ["cms", "premium"] },
  learning: { load: loadLearning, tags: ["learning"] },
  problems: { load: loadProblems, tags: ["learning", "practice"] },
  "interview-questions": { load: loadInterview, tags: ["interview-questions"] },
  jobs: { load: loadJobs, tags: ["jobs", "companies"] },
  projects: { load: loadProjects, tags: ["projects", "categories"] },
  blog: { load: loadBlog, tags: ["blog"] },
};

const cachedSection = Object.fromEntries(
  Object.entries(LOADERS).map(([section, { load, tags }]) => [
    section,
    unstable_cache(
      async (): Promise<SitemapEntry[]> => {
        const supabase = getPublicSupabase();
        if (!supabase) {
          // No Supabase env (e.g. a local build): the fixed pages still exist;
          // /faq and /premium would render empty (noindex), so they're left out.
          return section === "static" ? buildStaticEntries({ hasActiveFaqs: false, hasPremiumPlans: false }) : [];
        }
        // Covers multi-query sections as well as an individual stalled read.
        return publicReadDeadline(() => load(supabase), 20_000);
      },
      ["sitemap:section", section],
      { revalidate: SITEMAP_REVALIDATE, tags: [learningTag.sitemap, ...tags] },
    ),
  ]),
) as Record<SitemapSection, () => Promise<SitemapEntry[]>>;

/** Entries of one child sitemap. */
export async function getSitemapSectionEntries(section: SitemapSection): Promise<SitemapEntry[]> {
  return cachedSection[section]();
}

/**
 * The index: every non-empty child sitemap, lastmod = newest lastmod among its
 * entries (omitted if none). Empty sections (e.g. jobs while no job is open)
 * are left out so Search Console doesn't report an empty sitemap; their routes
 * still answer with a valid, empty urlset.
 */
export async function getSitemapIndexEntries(): Promise<SitemapEntry[]> {
  const sections = await Promise.all(SITEMAP_SECTIONS.map((s) => getSitemapSectionEntries(s)));
  return SITEMAP_SECTIONS.flatMap((section, i) =>
    sections[i].length === 0
      ? []
      : [{ path: sitemapSectionPath(section), lastModified: maxLastmod(sections[i].map((e) => e.lastModified)) }],
  );
}
