/** Shared list-page helpers for the project marketplace and jobs board. */

export const PROJECT_PAGE_SIZE = 24;
export const JOB_PAGE_SIZE = 20;

export const PROJECT_LIST_FIELDS =
  "id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller";
export const JOB_LIST_FIELDS =
  "id,title,company_name,company_logo_url,location,job_type,salary_range,posted_at";

export const PROJECT_SORTS = {
  newest: { column: "created_at", ascending: false, label: "Newest" },
  popular: { column: "sales_count", ascending: false, label: "Most popular" },
  "price-low": { column: "price", ascending: true, label: "Price: low to high" },
  "price-high": { column: "price", ascending: false, label: "Price: high to low" },
  rating: { column: "rating", ascending: false, label: "Top rated" },
} as const;
export type ProjectSort = keyof typeof PROJECT_SORTS;

export const JOB_SORTS = {
  newest: { column: "posted_at", ascending: false, label: "Newest" },
  "salary-high": { column: "salary_max_lpa", ascending: false, label: "Highest salary" },
} as const;
export type JobSort = keyof typeof JOB_SORTS;

export const JOB_TYPES = ["Full Time", "Part Time", "Internship", "Contract"] as const;

export function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parsePrice(value: string | undefined): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function projectSort(value: string | undefined): ProjectSort {
  return value && value in PROJECT_SORTS ? (value as ProjectSort) : "newest";
}

export function jobSort(value: string | undefined): JobSort {
  return value && value in JOB_SORTS ? (value as JobSort) : "newest";
}

export function totalPages(count: number | null, pageSize: number): number {
  return Math.max(1, Math.ceil((count ?? 0) / pageSize));
}

/** Drop empty values so links/hidden inputs stay clean. */
export function cleanParams(params: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (v) out[k] = v;
  return out;
}
