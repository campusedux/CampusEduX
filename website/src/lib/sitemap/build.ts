import { isTemplatedGenerativeAiBody, isThinCodingProblemRow } from "@/lib/contentQuality";
import { isRedirectedPath } from "@/lib/contentRedirects";

/**
 * Pure sitemap logic (no I/O): which public URLs go into which child sitemap,
 * with which `<lastmod>`, and how the XML is serialised. The server loaders in
 * `./data.ts` feed rows in; the route handlers under `src/app/sitemap.xml` and
 * `src/app/sitemaps/*` render the result.
 *
 * lastmod rules — never a build/request time:
 *   - a content URL uses its own row's `updated_at`;
 *   - a hub/listing URL uses the newest `updated_at` of the rows it lists;
 *   - a page with no real date (home, about, legal, …) has no `<lastmod>`.
 */

export type SitemapEntry = { path: string; lastModified?: string };

export const SITEMAP_SECTIONS = [
  "static",
  "learning",
  "problems",
  "interview-questions",
  "jobs",
  "projects",
  "blog",
] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

/** Public path of one child sitemap (served by `src/app/sitemaps/<section>.xml/route.ts`). */
export function sitemapSectionPath(section: SitemapSection): string {
  return `/sitemaps/${section}.xml`;
}

/**
 * Indexable pages with no database-backed content date. Hubs whose content
 * IS database-backed (/learning, /blog, /jobs, /projects, /practice/…) live in
 * their own section so they can carry a real lastmod.
 */
export const STATIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/support",
  "/compiler",
  "/resume",
  "/resume/templates",
  "/custom-projects",
  "/premium",
  "/legal",
  "/privacy-policy",
  "/terms",
  "/project-license",
  "/community-guidelines",
  "/disclaimer",
  "/grievance",
  "/refund-policy",
  "/cookie-policy",
  "/data-and-permissions",
  "/delete-account",
] as const;

/** Referral is omitted because its metadata can noindex when no reward rule exists. */
export const SITEMAP_EXCLUDED_PATHS = ["/referral"] as const;

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** A real timestamp → ISO 8601; anything missing or unparsable → undefined (no `<lastmod>`). */
export function toLastmod(value: unknown): string | undefined {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isFinite(t) ? d.toISOString() : undefined;
}

/** Newest of the given timestamps (ISO), ignoring missing/invalid ones. */
export function maxLastmod(values: Iterable<unknown>): string | undefined {
  let best: number | undefined;
  for (const v of values) {
    const iso = toLastmod(v);
    if (!iso) continue;
    const t = Date.parse(iso);
    if (best === undefined || t > best) best = t;
  }
  return best === undefined ? undefined : new Date(best).toISOString();
}

const seg = (s: string) => encodeURIComponent(s);

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/**
 * Pages in STATIC_SITEMAP_PATHS whose own metadata turns `noindex` when the
 * data behind them is empty — listed only when that data exists, so the
 * sitemap never promotes a page that asks not to be indexed.
 */
export type StaticPageData = { hasActiveFaqs: boolean; hasPremiumPlans: boolean };

export function buildStaticEntries(data: StaticPageData): SitemapEntry[] {
  return STATIC_SITEMAP_PATHS.filter((path) => {
    if (path === "/faq") return data.hasActiveFaqs;
    if (path === "/premium") return data.hasPremiumPlans;
    return true;
  }).map((path) => ({ path }));
}

export const GENERATIVE_AI_GRID_SLUG = "generative-ai";

export type LearningSitemapRow = { grid_slug: string; topic_slug: string | null; updated_at: string | null };

/**
 * `/learning`, every grid landing page and every topic from `learning_sitemap`
 * (published + website-visible only — enforced by the RPC). Topics listed in
 * `thinGenerativeAiTopicSlugs` are dropped because their own page is noindex
 * (see `isTemplatedGenerativeAiBody`). A grid landing page's lastmod is the
 * newest of the grid row and all of its visible topics (it lists them all).
 */
export function buildLearningEntries(
  rows: LearningSitemapRow[],
  thinGenerativeAiTopicSlugs: ReadonlySet<string>,
  topicsWithContent?: ReadonlySet<string>,
): SitemapEntry[] {
  if (!rows.some((row) => row.grid_slug)) return [];
  const gridDates = new Map<string, unknown[]>();
  const topics: SitemapEntry[] = [];
  for (const row of rows) {
    if (!row.grid_slug) continue;
    const dates = gridDates.get(row.grid_slug) ?? [];
    dates.push(row.updated_at);
    gridDates.set(row.grid_slug, dates);
    if (!row.topic_slug) continue;
    if (topicsWithContent && !topicsWithContent.has(`${row.grid_slug}/${row.topic_slug}`)) continue;
    if (row.grid_slug === GENERATIVE_AI_GRID_SLUG && thinGenerativeAiTopicSlugs.has(row.topic_slug)) continue;
    topics.push({
      path: `/learning/${seg(row.grid_slug)}/${seg(row.topic_slug)}`,
      lastModified: toLastmod(row.updated_at),
    });
  }
  const entries: SitemapEntry[] = [
    { path: "/learning", lastModified: maxLastmod(rows.filter((r) => r.grid_slug).map((r) => r.updated_at)) },
  ];
  gridDates.forEach((dates, grid) => {
    entries.push({ path: `/learning/${seg(grid)}`, lastModified: maxLastmod(dates) });
  });
  return entries.concat(topics);
}


/** Concatenated content bodies per topic slug → the set of templated (noindexed) GenAI topics. */
export function thinGenerativeAiTopicSlugs(bodyByTopicSlug: ReadonlyMap<string, string>): Set<string> {
  const thin = new Set<string>();
  bodyByTopicSlug.forEach((body, slug) => {
    if (isTemplatedGenerativeAiBody(body)) thin.add(slug);
  });
  return thin;
}

export type CodingProblemThinCheckRow = {
  slug: string;
  examples: unknown[] | null;
  constraints: unknown[] | null;
  starter_code: Record<string, unknown> | null;
  is_premium: boolean | null;
};

export function thinCodingProblemSlugs(rows: CodingProblemThinCheckRow[]): Set<string> {
  const thin = new Set<string>();
  for (const row of rows) if (row.slug && isThinCodingProblemRow(row)) thin.add(row.slug);
  return thin;
}

export type SlugDateRow = { slug: string; updated_at: string | null };

/**
 * Topic coding problems (`/coding-problems/<slug>`, thin ones excluded exactly
 * as their page's own noindex does) + the global Practice hub and problems.
 */
export function buildProblemEntries(
  codingProblems: SlugDateRow[],
  thinCodingSlugs: ReadonlySet<string>,
  practiceProblems: SlugDateRow[],
): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { path: "/practice" },
    ...(practiceProblems.length > 0
      ? [{ path: "/practice/problems", lastModified: maxLastmod(practiceProblems.map((r) => r.updated_at)) }]
      : []),
  ];
  for (const row of practiceProblems) {
    if (!row.slug) continue;
    entries.push({ path: `/practice/problems/${seg(row.slug)}`, lastModified: toLastmod(row.updated_at) });
  }
  for (const row of codingProblems) {
    if (!row.slug || thinCodingSlugs.has(row.slug)) continue;
    entries.push({ path: `/coding-problems/${seg(row.slug)}`, lastModified: toLastmod(row.updated_at) });
  }
  return entries;
}

export type InterviewSitemapRow = { category_slug: string; topic_slug: string; updated_at: string | null };

/**
 * Interview Questions hub, every category page that has at least one
 * published website-visible topic, and every topic page.
 */
export function buildInterviewEntries(rows: InterviewSitemapRow[]): SitemapEntry[] {
  if (!rows.some((row) => row.category_slug && row.topic_slug)) return [];
  const categoryDates = new Map<string, unknown[]>();
  const topics: SitemapEntry[] = [];
  for (const row of rows) {
    if (!row.category_slug || !row.topic_slug) continue;
    const dates = categoryDates.get(row.category_slug) ?? [];
    dates.push(row.updated_at);
    categoryDates.set(row.category_slug, dates);
    topics.push({
      path: `/practice/interview-questions/${seg(row.category_slug)}/${seg(row.topic_slug)}`,
      lastModified: toLastmod(row.updated_at),
    });
  }
  const entries: SitemapEntry[] = [
    { path: "/practice/interview-questions", lastModified: maxLastmod(rows.map((r) => r.updated_at)) },
  ];
  categoryDates.forEach((dates, cat) => {
    entries.push({ path: `/practice/interview-questions/${seg(cat)}`, lastModified: maxLastmod(dates) });
  });
  return entries.concat(topics);
}

export type IdDateRow = { id: string; updated_at: string | null };

export type JobSitemapRow = IdDateRow & { company_id: string | null };

/**
 * Open, unexpired jobs + the companies that currently have at least one of
 * them. A company page with no open role is just a name and a blurb (thin),
 * so it stays out; the /jobs and /jobs/companies hubs are only listed when
 * they have something to list (/jobs marks itself noindex when empty).
 * A company page's lastmod is the newest of its row and its open jobs.
 */
export function buildJobEntries(activeJobs: JobSitemapRow[], companies: IdDateRow[]): SitemapEntry[] {
  const jobDatesByCompany = new Map<string, unknown[]>();
  for (const j of activeJobs) {
    if (!j.company_id) continue;
    const dates = jobDatesByCompany.get(j.company_id) ?? [];
    dates.push(j.updated_at);
    jobDatesByCompany.set(j.company_id, dates);
  }
  const hiring = companies.filter((c) => c.id && jobDatesByCompany.has(c.id));

  const entries: SitemapEntry[] = [];
  if (activeJobs.length > 0) {
    entries.push({ path: "/jobs", lastModified: maxLastmod(activeJobs.map((j) => j.updated_at)) });
  }
  if (hiring.length > 0) {
    entries.push({ path: "/jobs/companies", lastModified: maxLastmod(hiring.map((c) => c.updated_at)) });
  }
  for (const j of activeJobs) if (j.id) entries.push({ path: `/jobs/${seg(j.id)}`, lastModified: toLastmod(j.updated_at) });
  for (const c of hiring) {
    entries.push({
      path: `/jobs/companies/${seg(c.id)}`,
      lastModified: maxLastmod([c.updated_at, ...(jobDatesByCompany.get(c.id) ?? [])]),
    });
  }
  return entries;
}

export type ProjectSitemapRow = IdDateRow & { category_id: string | null };

/**
 * Projects, the marketplace hubs, and category pages. A category with no
 * visible project is left out: its page marks itself noindex.
 */
export function buildProjectEntries(projects: ProjectSitemapRow[], categories: IdDateRow[]): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  if (projects.length > 0) {
    entries.push({ path: "/projects", lastModified: maxLastmod(projects.map((p) => p.updated_at)) });
    entries.push({ path: "/projects/trending" });
  }
  const projectDatesByCategory = new Map<string, unknown[]>();
  for (const p of projects) {
    if (!p.id) continue;
    entries.push({ path: `/projects/${seg(p.id)}`, lastModified: toLastmod(p.updated_at) });
    if (p.category_id) {
      const dates = projectDatesByCategory.get(p.category_id) ?? [];
      dates.push(p.updated_at);
      projectDatesByCategory.set(p.category_id, dates);
    }
  }
  for (const c of categories) {
    const dates = c.id ? projectDatesByCategory.get(c.id) : undefined;
    if (!dates) continue;
    entries.push({ path: `/projects/category/${seg(c.id)}`, lastModified: maxLastmod([c.updated_at, ...dates]) });
  }
  return entries;
}

export type BlogSitemapRow = SlugDateRow & { canonical_url?: string | null };

/**
 * Published posts. A post whose `canonical_url` points somewhere else (its
 * page's canonical) is not a canonical URL of ours, so it stays out.
 */
export function buildBlogEntries(posts: BlogSitemapRow[], siteUrl: string): SitemapEntry[] {
  const own = posts.filter((p) => {
    if (!p.slug) return false;
    const canonical = (p.canonical_url ?? "").trim();
    return canonical === "" || canonical === absoluteSitemapUrl(siteUrl, `/blog/${seg(p.slug)}`);
  });
  // Externally canonicalized posts still populate the listing; only their
  // detail URLs are excluded. The empty listing itself carries noindex.
  const entries: SitemapEntry[] = posts.length > 0
    ? [{ path: "/blog", lastModified: maxLastmod(own.map((p) => p.updated_at)) }]
    : [];
  for (const p of own) entries.push({ path: `/blog/${seg(p.slug)}`, lastModified: toLastmod(p.updated_at) });
  return entries;
}

// ---------------------------------------------------------------------------
// XML
// ---------------------------------------------------------------------------

/** Absolute URL for a site path. The home page is the bare origin — the exact form of its canonical tag. */
export function absoluteSitemapUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  if (path === "/" || path === "") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * De-duplicates by path (first occurrence wins) so a URL is never listed twice,
 * and drops paths that 301 to another page (src/lib/contentRedirects.ts).
 */
export function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) =>
    seen.has(e.path) || isRedirectedPath(e.path) ? false : (seen.add(e.path), true),
  );
}

export function renderUrlset(siteUrl: string, entries: SitemapEntry[]): string {
  if (entries.length > 50000) throw new Error("Sitemap section needs numbered shards");
  const body = dedupeEntries(entries)
    .map((e) => {
      const loc = `<loc>${escapeXml(absoluteSitemapUrl(siteUrl, e.path))}</loc>`;
      const lastmod = e.lastModified ? `<lastmod>${escapeXml(e.lastModified)}</lastmod>` : "";
      return `<url>${loc}${lastmod}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderSitemapIndex(siteUrl: string, children: SitemapEntry[]): string {
  const body = children
    .map((c) => {
      const loc = `<loc>${escapeXml(absoluteSitemapUrl(siteUrl, c.path))}</loc>`;
      const lastmod = c.lastModified ? `<lastmod>${escapeXml(c.lastModified)}</lastmod>` : "";
      return `<sitemap>${loc}${lastmod}</sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
