import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import { onlyActiveJobs } from "@/lib/jobsActive";
import { searchLearning } from "@/lib/learning";
import {
  type GlobalSearchResult,
  type SearchGroup,
  type SearchResultItem,
  type SearchGroupType,
  SEARCH_GROUP_LABEL,
  SEARCH_GROUP_ORDER,
  sanitizeSearchTerm,
  isSearchableTerm,
  arrayMatchVariants,
  withQuery,
  projectHref,
  jobHref,
  blogHref,
  learningHref,
  resumeTemplatesHref,
} from "@/lib/searchModel";

/**
 * Global site search — the one query path behind the navbar search field, the
 * `/search` results page and `GET /api/search` (typeahead).
 *
 * Every read runs on the anon key through `getPublicSupabase()` / the Learning
 * SECURITY DEFINER RPCs, so RLS is the only gate: `projects` / `jobs` /
 * `blog_posts` (published) / `resume_templates` (active) are all world-readable
 * `using (true)`, and `learning_search` enforces the published + platform +
 * premium chain itself. Nothing user-scoped is ever touched here.
 *
 * Results are grouped BY CONTENT TYPE and each item carries the href of its own
 * detail page — a tutorial hit links to the tutorial, a job hit to the job,
 * never everything to `/projects`.
 *
 * The assembled result is wrapped in `unstable_cache` (tags:
 * projects / jobs / blog / learning / resume-templates) so a repeated search is
 * one cache read, and an admin edit that busts any of those tags refreshes it.
 */

/** Rows per group for the typeahead dropdown. */
export const SUGGEST_LIMIT = 5;
/** Rows per group shown on the `/search` page before "View all". */
export const RESULTS_LIMIT = 8;

const REVALIDATE = 60;

type SubResult = { items: SearchResultItem[]; total: number };

const EMPTY: SubResult = { items: [], total: 0 };

/** `col.ilike.%term%` for each column, joined for a PostgREST `.or(...)`. */
function orIlike(cols: string[], term: string): string {
  return cols.map((c) => `${c}.ilike.%${term}%`).join(",");
}

/** Append `extra` rows (id-keyed) not already in `base`, capped at `limit`. */
function mergeById(base: SearchResultItem[], extra: SearchResultItem[], limit: number): SearchResultItem[] {
  const seen = new Set(base.map((i) => i.id));
  const out = [...base];
  for (const item of extra) {
    if (out.length >= limit) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out.slice(0, limit);
}

// ---- Projects -------------------------------------------------------------
async function searchProjects(term: string, limit: number): Promise<SubResult> {
  const supabase = getPublicSupabase();
  if (!supabase) return EMPTY;
  try {
    const toItem = (r: {
      id: string;
      title: string;
      category_name: string | null;
      tech_stack: string[] | null;
      is_premium: boolean | null;
    }): SearchResultItem => ({
      id: r.id,
      title: r.title,
      subtitle:
        (Array.isArray(r.tech_stack) && r.tech_stack.length
          ? r.tech_stack.slice(0, 3).join(" · ")
          : null) ||
        r.category_name ||
        null,
      href: projectHref(r.id),
      isPremium: Boolean(r.is_premium),
    });
    const cols = "id,title,category_name,tech_stack,is_premium";

    const [text, tech] = await Promise.all([
      supabase
        .from("projects")
        .select(cols, { count: "exact" })
        .or(orIlike(["title", "description", "category_name"], term))
        .order("sales_count", { ascending: false })
        .limit(limit),
      // tech_stack is text[] — can't be ilike'd; match exact elements, any case.
      supabase
        .from("projects")
        .select(cols)
        .overlaps("tech_stack", arrayMatchVariants(term))
        .order("sales_count", { ascending: false })
        .limit(limit),
    ]);

    const base = (text.data ?? []).map(toItem);
    const items = mergeById(base, (tech.data ?? []).map(toItem), limit);
    const extra = items.length - base.length;
    return { items, total: (text.count ?? base.length) + Math.max(0, extra) };
  } catch {
    return EMPTY;
  }
}

// ---- Jobs --------------------------------------------------------------
async function searchJobs(term: string, limit: number): Promise<SubResult> {
  const supabase = getPublicSupabase();
  if (!supabase) return EMPTY;
  try {
    const toItem = (r: {
      id: string;
      title: string;
      company_name: string | null;
      location: string | null;
      job_type: string | null;
      is_premium?: boolean | null;
    }): SearchResultItem => ({
      id: r.id,
      title: r.title,
      subtitle: [r.company_name, r.location].filter(Boolean).join(" · ") || r.job_type || null,
      href: jobHref(r.id),
    });
    const cols = "id,title,company_name,location,job_type";

    const [text, skills] = await Promise.all([
      onlyActiveJobs(supabase.from("jobs").select(cols, { count: "exact" }))
        .or(orIlike(["title", "company_name", "location", "description", "experience"], term))
        .order("posted_at", { ascending: false })
        .limit(limit),
      onlyActiveJobs(supabase.from("jobs").select(cols))
        .overlaps("skills", arrayMatchVariants(term))
        .order("posted_at", { ascending: false })
        .limit(limit),
    ]);

    const base = (text.data ?? []).map(toItem);
    const items = mergeById(base, (skills.data ?? []).map(toItem), limit);
    const extra = items.length - base.length;
    return { items, total: (text.count ?? base.length) + Math.max(0, extra) };
  } catch {
    return EMPTY;
  }
}

// ---- Blog --------------------------------------------------------------
async function searchBlog(term: string, limit: number): Promise<SubResult> {
  const supabase = getPublicSupabase();
  if (!supabase) return EMPTY;
  try {
    const toItem = (r: {
      id: string;
      title: string;
      slug: string;
      category_name: string | null;
      excerpt: string | null;
    }): SearchResultItem => ({
      id: r.id,
      title: r.title,
      subtitle: r.category_name || (r.excerpt ? r.excerpt.slice(0, 100) : null),
      href: blogHref(r.slug),
    });
    const cols = "id,title,slug,category_name,excerpt";

    const [text, tags] = await Promise.all([
      supabase
        .from("blog_posts")
        .select(cols, { count: "exact" })
        .eq("status", "published")
        .or(orIlike(["title", "excerpt", "category_name"], term))
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from("blog_posts")
        .select(cols)
        .eq("status", "published")
        .overlaps("tags", arrayMatchVariants(term))
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit),
    ]);

    const base = (text.data ?? []).map(toItem);
    const items = mergeById(base, (tags.data ?? []).map(toItem), limit);
    const extra = items.length - base.length;
    return { items, total: (text.count ?? base.length) + Math.max(0, extra) };
  } catch {
    return EMPTY;
  }
}

// ---- Learning (grids + topics, via the existing RPC) --------------------
async function searchLearningGroup(term: string, limit: number): Promise<SubResult> {
  try {
    const hits = await searchLearning(term, Math.max(limit, 12));
    const items: SearchResultItem[] = hits.slice(0, limit).map((h, i) => ({
      id: `${h.grid_slug}/${h.topic_slug ?? "grid"}#${i}`,
      title: h.title,
      subtitle:
        h.kind === "grid"
          ? h.snippet || "Learning resource"
          : [h.grid_name, h.section_name].filter(Boolean).join(" · ") || h.grid_name,
      href: learningHref(h.grid_slug, h.topic_slug),
      isPremium: h.is_premium,
    }));
    return { items, total: Math.min(hits.length, Math.max(limit, 12)) };
  } catch {
    return EMPTY;
  }
}

// ---- Resume templates (active set) ------------------------------------
async function searchResumeTemplates(term: string, limit: number): Promise<SubResult> {
  const supabase = getPublicSupabase();
  if (!supabase) return EMPTY;
  try {
    const { data, count } = await supabase
      .from("resume_templates")
      .select("id,name,description,is_premium", { count: "exact" })
      .eq("status", "active")
      .or(orIlike(["name", "description"], term))
      .order("sort_order")
      .limit(limit);
    const items: SearchResultItem[] = (data ?? []).map(
      (t: { id: string; name: string | null; description: string | null; is_premium: boolean | null }) => ({
        id: t.id,
        title: t.name ?? "Resume template",
        subtitle: t.description || "Resume template",
        href: resumeTemplatesHref(),
        isPremium: Boolean(t.is_premium),
      }),
    );
    return { items, total: count ?? items.length };
  } catch {
    return EMPTY;
  }
}

const ALL_HREF: Record<SearchGroupType, (term: string) => string | null> = {
  learning: (t) => withQuery("/learning", t),
  projects: (t) => withQuery("/projects", t),
  jobs: (t) => withQuery("/jobs", t),
  blog: (t) => withQuery("/blog", t),
  resume: () => resumeTemplatesHref(),
};

async function runGlobalSearchUncached(term: string, perGroup: number): Promise<GlobalSearchResult> {
  const [learning, projects, jobs, blog, resume] = await Promise.all([
    searchLearningGroup(term, perGroup),
    searchProjects(term, perGroup),
    searchJobs(term, perGroup),
    searchBlog(term, perGroup),
    searchResumeTemplates(term, perGroup),
  ]);
  const byType: Record<SearchGroupType, SubResult> = { learning, projects, jobs, blog, resume };

  const groups: SearchGroup[] = SEARCH_GROUP_ORDER.map((type) => {
    const sub = byType[type];
    return {
      type,
      label: SEARCH_GROUP_LABEL[type],
      allHref: sub.items.length ? ALL_HREF[type](term) : null,
      items: sub.items,
      total: Math.max(sub.total, sub.items.length),
    };
  }).filter((g) => g.items.length > 0);

  const total = groups.reduce((n, g) => n + g.total, 0);
  return { q: term, groups, total };
}

const cachedRun = unstable_cache(
  (term: string, perGroup: number) => runGlobalSearchUncached(term, perGroup),
  ["global-search"],
  { revalidate: REVALIDATE, tags: ["projects", "jobs", "blog", "learning", "resume-templates"] },
);

/**
 * Run a global search. `rawQ` is sanitised here; a term shorter than
 * `MIN_SEARCH_TERM` returns an empty result (never an error). `perGroup` caps
 * rows per content type — `SUGGEST_LIMIT` for the dropdown, `RESULTS_LIMIT` for
 * the page.
 */
export async function runGlobalSearch(
  rawQ: string,
  perGroup: number = RESULTS_LIMIT,
): Promise<GlobalSearchResult> {
  const term = sanitizeSearchTerm(rawQ);
  if (!isSearchableTerm(term)) return { q: term, groups: [], total: 0 };
  return cachedRun(term, perGroup);
}
