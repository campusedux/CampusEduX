import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import { onlyActiveJobs } from "@/lib/jobsActive";

/**
 * Cross-request cache layer for **public catalog** reads.
 *
 * Why this exists: `@supabase/supabase-js` issues its HTTP calls through a
 * wrapped `fetch`, so Next's built-in fetch cache never sees them — every
 * Supabase query is a fresh round-trip on every render. `unstable_cache()`
 * memoises the *result* of a query across requests and users, keyed by its
 * arguments, with `revalidate` + tag-based invalidation.
 *
 * Only ever wrap ANON, non-personalised reads here (RLS `using (true)` tables:
 * projects, jobs, categories, companies, faqs, testimonials, banners,
 * offer_banners, premium_*, resume_templates, learning_* RPCs). Never a
 * cookie-bound / user-scoped query.
 *
 * Invalidation: `POST /api/revalidate` with `{ "tags": ["projects"] }` (from the
 * admin panel or a DB webhook) busts a tag immediately; otherwise entries
 * refresh on their own `revalidate` interval.
 */

export const CACHE_TAGS = {
  projects: "projects",
  jobs: "jobs",
  categories: "categories",
  companies: "companies",
  home: "home",
  learning: "learning",
  premium: "premium",
  resumeTemplates: "resume-templates",
  cms: "cms", // faqs / testimonials / banners / reward_settings
  blog: "blog", // blog_posts / blog_categories
} as const;

const FIVE_MIN = 300;
const TWO_MIN = 120;

/** `categories` — tiny, changes only via the admin panel. Used by the marketplace filters + category chips. */
export const getCachedCategories = unstable_cache(
  async (): Promise<{ id: string; name: string }[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from("categories").select("id,name").order("name");
    return data ?? [];
  },
  ["catalog:categories"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.categories] },
);

/** One category's name + a bounded preview of its projects, for `/projects/category/[category]`. */
export const getCachedCategoryPreview = unstable_cache(
  async (categoryId: string) => {
    const supabase = getPublicSupabase();
    if (!supabase) return { name: categoryId, projects: [] as unknown[] };
    const [{ data: cat }, { data }] = await Promise.all([
      supabase.from("categories").select("name").eq("id", categoryId).maybeSingle(),
      supabase
        .from("projects")
        .select(
          "id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller",
        )
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false })
        .limit(48),
    ]);
    return { name: cat?.name ?? categoryId, projects: data ?? [] };
  },
  ["catalog:category-preview"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.projects, CACHE_TAGS.categories] },
);

/** All category ids — for `generateStaticParams` on `/projects/category/[category]`. */
export const getCachedCategoryIds = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from("categories").select("id");
    return (data ?? []).map((c) => c.id);
  },
  ["catalog:category-ids"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.categories] },
);

// ---- Home page ------------------------------------------------------------
// The home route is ISR (`revalidate = 300`) but its 5 queries still run on
// every cold/background render. Cache the raw rows (tags: home + cms) so a
// revalidation is one cache read, and an admin edit can bust it immediately.

export interface HomeRawData {
  trending: unknown[];
  jobs: unknown[];
  testimonials: unknown[];
  faqs: unknown[];
  banners: {
    id: string;
    title: string;
    subtitle: string;
    image_url: string | null;
    target_url: string | null;
    starts_at: string | null;
    ends_at: string | null;
  }[];
}

export const getCachedHomeData = unstable_cache(
  async (): Promise<HomeRawData> => {
    const empty: HomeRawData = { trending: [], jobs: [], testimonials: [], faqs: [], banners: [] };
    const supabase = getPublicSupabase();
    if (!supabase) return empty;

    const [trending, jobs, testimonials, faqs, banners] = await Promise.all([
      supabase
        .from("projects")
        .select(PROJECT_LIST_FIELDS)
        .order("sales_count", { ascending: false })
        .limit(8),
      onlyActiveJobs(supabase.from("jobs").select(JOB_LIST_FIELDS)).order("posted_at", { ascending: false }).limit(6),
      supabase
        .from("testimonials")
        .select("id,author_name,author_role,quote,rating")
        .eq("status", "active")
        .order("sort_order")
        .limit(6),
      supabase.from("faqs").select("id,question,answer").eq("status", "active").order("sort_order").limit(5),
      supabase
        .from("banners")
        .select("id,title,subtitle,image_url,target_url,starts_at,ends_at")
        .eq("placement", "home")
        .eq("status", "active")
        .order("priority", { ascending: false })
        .limit(5),
    ]);

    return {
      trending: trending.data ?? [],
      jobs: jobs.data ?? [],
      testimonials: testimonials.data ?? [],
      faqs: faqs.data ?? [],
      banners: banners.data ?? [],
    };
  },
  ["catalog:home"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.home, CACHE_TAGS.cms] },
);

// ---- Marketplace / jobs list pages -----------------------------------------
// These routes are dynamically rendered (they read `searchParams`), but the
// underlying queries are identical for every visitor with the same filters —
// so cache the *data* keyed by the normalised filter set. `unstable_cache`
// hashes the function args into the key automatically.

const PROJECT_LIST_FIELDS =
  "id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller";
const JOB_LIST_FIELDS =
  "id,title,company_name,company_logo_url,location,job_type,salary_range,posted_at";

export interface ProjectsPageArgs {
  page: number;
  from: number;
  size: number;
  sortColumn: string;
  sortAscending: boolean;
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  flag?: "premium" | "bestseller";
}

export const getCachedProjectsPage = unstable_cache(
  async (a: ProjectsPageArgs): Promise<{ projects: unknown[]; count: number | null }> => {
    const supabase = getPublicSupabase();
    if (!supabase) return { projects: [], count: 0 };

    let query = supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS, { count: "exact" })
      .order(a.sortColumn, { ascending: a.sortAscending })
      .range(a.from, a.from + a.size - 1);

    if (a.q) query = query.ilike("title", `%${a.q}%`);
    if (a.category) query = query.eq("category_id", a.category);
    if (a.min !== undefined) query = query.gte("price", a.min);
    if (a.max !== undefined) query = query.lte("price", a.max);
    if (a.flag === "premium") query = query.eq("is_premium", true);
    if (a.flag === "bestseller") query = query.eq("is_best_seller", true);

    const { data, count } = await query;
    return { projects: data ?? [], count };
  },
  ["catalog:projects-page"],
  { revalidate: TWO_MIN, tags: [CACHE_TAGS.projects] },
);

export interface JobsPageArgs {
  from: number;
  size: number;
  sortColumn: string;
  sortAscending: boolean;
  q?: string;
  location?: string;
  type?: string;
}

export const getCachedJobsPage = unstable_cache(
  async (a: JobsPageArgs): Promise<{ jobs: unknown[]; count: number | null }> => {
    const supabase = getPublicSupabase();
    if (!supabase) return { jobs: [], count: 0 };

    let query = onlyActiveJobs(supabase.from("jobs").select(JOB_LIST_FIELDS, { count: "exact" }))
      .order(a.sortColumn, { ascending: a.sortAscending, nullsFirst: false })
      .range(a.from, a.from + a.size - 1);

    if (a.q) query = query.ilike("title", `%${a.q}%`);
    if (a.location) query = query.ilike("location", `%${a.location}%`);
    if (a.type) query = query.eq("job_type", a.type);

    const { data, count } = await query;
    return { jobs: data ?? [], count };
  },
  ["catalog:jobs-page"],
  { revalidate: TWO_MIN, tags: [CACHE_TAGS.jobs] },
);

/** `resume_templates` (active) — read on every résumé page. */
export const getCachedResumeTemplates = unstable_cache(
  async (): Promise<
    { id: string; name: string; description: string; is_premium: boolean; accent_color: string }[]
  > => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from("resume_templates")
      .select("id,name,description,is_premium,accent_color")
      .eq("status", "active")
      .order("sort_order");
    return data ?? [];
  },
  ["catalog:resume-templates"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.resumeTemplates] },
);

/**
 * One project row + its reviews + related, for `/projects/[id]`. Keyed by id.
 * Returns `null` when Supabase is unconfigured, `{ project: null }` when the id
 * doesn't exist (caller 404s).
 */
export const getCachedProjectDetail = unstable_cache(
  async (id: string) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;

    const { data: project } = await supabase
      .from("projects")
      .select(
        "id,title,category_id,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller,description,images,license,platform_fee_percent",
      )
      .eq("id", id)
      .single();
    if (!project) return { project: null, reviews: [], related: [] };

    const [{ data: reviews }, { data: related }] = await Promise.all([
      supabase
        .from("reviews")
        .select("id,rating,comment,created_at,profile:profiles(full_name)")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      project.category_id
        ? supabase
            .from("projects")
            .select(
              "id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller",
            )
            .eq("category_id", project.category_id)
            .neq("id", id)
            .limit(4)
        : Promise.resolve({ data: [] }),
    ]);

    return { project, reviews: reviews ?? [], related: related ?? [] };
  },
  ["catalog:project-detail"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.projects] },
);

/** Top project ids by sales — for `generateStaticParams` prerendering the popular detail pages. */
export const getCachedTopProjectIds = unstable_cache(
  async (limit = 40): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from("projects")
      .select("id")
      .order("sales_count", { ascending: false })
      .limit(limit);
    return (data ?? []).map((p) => p.id);
  },
  ["catalog:top-project-ids"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.projects] },
);

/** One job row (+ company) for `/jobs/[id]`. Keyed by id. */
export const getCachedJobDetail = unstable_cache(
  async (id: string) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    // Drafts are never public (→ null → 404). Closed / expired rows ARE returned so
    // the page can show "no longer accepting applications" instead of a 404.
    const { data } = await supabase
      .from("jobs")
      .select("*, company:companies(id, name, logo_url, about, website)")
      .eq("id", id)
      .neq("status", "draft")
      .maybeSingle();
    return data ?? null;
  },
  ["catalog:job-detail"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.jobs] },
);

/** Recent job ids — for `generateStaticParams`. */
export const getCachedRecentJobIds = unstable_cache(
  async (limit = 40): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await onlyActiveJobs(supabase.from("jobs").select("id"))
      .order("posted_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((j) => j.id);
  },
  ["catalog:recent-job-ids"],
  { revalidate: TWO_MIN, tags: [CACHE_TAGS.jobs] },
);

/** One company profile + its open roles, for `/jobs/companies/[id]`. Keyed by id. */
export const getCachedCompanyDetail = unstable_cache(
  async (id: string) => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const [{ data: company }, { data: jobs }] = await Promise.all([
      supabase.from("companies").select("id,name,logo_url,about,employee_count,rating").eq("id", id).single(),
      onlyActiveJobs(
        supabase
          .from("jobs")
          .select("id,title,company_name,company_logo_url,location,job_type,salary_range,posted_at"),
      )
        .eq("company_id", id)
        .order("posted_at", { ascending: false })
        .limit(50),
    ]);
    if (!company) return null;
    return { company, jobs: jobs ?? [] };
  },
  ["catalog:company-detail"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.companies, CACHE_TAGS.jobs] },
);

/** All company ids — small set, for `generateStaticParams` on `/jobs/companies/[id]`. */
export const getCachedCompanyIds = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase.from("companies").select("id").limit(500);
    return (data ?? []).map((c) => c.id);
  },
  ["catalog:company-ids"],
  { revalidate: FIVE_MIN, tags: [CACHE_TAGS.companies] },
);
