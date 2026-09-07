/**
 * Pure, dependency-free helpers + types for global site search. Shared by the
 * server search layer (`src/lib/search.ts`), the `/search` results page and the
 * navbar search island. No React / next / supabase imports here on purpose —
 * everything below is unit-testable in plain Node.
 */

export type SearchGroupType = "learning" | "projects" | "jobs" | "blog" | "resume";

export interface SearchResultItem {
  /** Stable key inside its group. */
  id: string;
  title: string;
  /** One muted line under the title (tech line, company, grid + section…). */
  subtitle?: string | null;
  /** Absolute in-app path to the correct detail page for THIS result type. */
  href: string;
  /** Render a small "Premium" pill (premium learning topics / templates). */
  isPremium?: boolean;
}

export interface SearchGroup {
  type: SearchGroupType;
  /** Human label — "Projects", "Learning", "Jobs", "Blog", "Resume templates". */
  label: string;
  /** "View all" target — the type's own listing filtered by the query, or null. */
  allHref: string | null;
  items: SearchResultItem[];
  /**
   * Total matches for this group — can exceed `items.length`. Accurate for
   * Projects / Jobs / Blog (DB `count`); equals `items.length` for Learning /
   * Resume where the source gives no separate count.
   */
  total: number;
}

export interface GlobalSearchResult {
  /** The sanitised term the results are for. */
  q: string;
  /** Non-empty groups only, in `SEARCH_GROUP_ORDER`. */
  groups: SearchGroup[];
  /** Sum of every group's `total`. */
  total: number;
}

/** Display order on the results page + suggestions dropdown. */
export const SEARCH_GROUP_ORDER: SearchGroupType[] = [
  "learning",
  "projects",
  "jobs",
  "blog",
  "resume",
];

export const SEARCH_GROUP_LABEL: Record<SearchGroupType, string> = {
  learning: "Learning",
  projects: "Projects",
  jobs: "Jobs",
  blog: "Blog",
  resume: "Resume templates",
};

/** Shortest / longest term we will run against the database. */
export const MIN_SEARCH_TERM = 2;
export const MAX_SEARCH_TERM = 80;

/**
 * Normalise a raw query for safe use in PostgREST `ilike` / `or(...)` filters:
 * strip the characters that would change filter *structure* (`, ( ) " \`) or act
 * as SQL-LIKE wildcards (`% _ *`), collapse whitespace, trim, cap the length.
 * Returns `""` for an empty / all-punctuation query — callers treat that as
 * "no search", never as an error.
 */
export function sanitizeSearchTerm(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[%_,()"\\*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_TERM);
}

/** `true` when a sanitised term is long enough to search on. */
export function isSearchableTerm(term: string): boolean {
  return term.length >= MIN_SEARCH_TERM;
}

/**
 * Case variants of a term for an exact-element array match
 * (`projects.tech_stack`, `jobs.skills`, `blog_posts.tags`) — those columns
 * can't be `ilike`d, so widen `"java"` to `["java", "Java", "JAVA"]` and match
 * with a single `overlaps(...)` query instead of a second round-trip per form.
 */
export function arrayMatchVariants(term: string): string[] {
  const lower = term.toLowerCase();
  const cap = lower.charAt(0).toUpperCase() + lower.slice(1);
  return Array.from(new Set([term, lower, cap, term.toUpperCase()])).filter(Boolean);
}

/** `("/projects", "java")` → `"/projects?q=java"`; empty term → `"/projects"`. */
export function withQuery(base: string, q: string): string {
  const t = q.trim();
  return t ? `${base}?q=${encodeURIComponent(t)}` : base;
}

// ---- detail-page href builders — a global result NEVER routes to /projects ---

export function projectHref(id: string): string {
  return `/projects/${encodeURIComponent(id)}`;
}
export function jobHref(id: string): string {
  return `/jobs/${encodeURIComponent(id)}`;
}
export function blogHref(slug: string): string {
  return `/blog/${slug}`;
}
export function learningHref(gridSlug: string, topicSlug?: string | null): string {
  return topicSlug ? `/learning/${gridSlug}/${topicSlug}` : `/learning/${gridSlug}`;
}
export function resumeTemplatesHref(): string {
  return "/resume/templates";
}

/** Flatten every group's items in display order — for keyboard nav in the dropdown. */
export function flattenGroups(groups: SearchGroup[]): SearchResultItem[] {
  return groups.flatMap((g) => g.items);
}
