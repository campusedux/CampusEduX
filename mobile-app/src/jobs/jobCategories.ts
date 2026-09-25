import type { Ionicons } from "@expo/vector-icons";
import type { JobCategoryCount, JobDashboardStats } from "@/types";

/** The fixed category set — mirrors migration 0114 `job_canonical_category()`. */
export const FIXED_CATEGORIES = [
  "IT & Software",
  "Core Engineering",
  "Data/AI",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
] as const;

export const OTHER_CATEGORY = "Other";

export const ALL_CATEGORY_NAMES: readonly string[] = [...FIXED_CATEGORIES, OTHER_CATEGORY];

export interface CategoryStyle {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "IT & Software": { icon: "code-slash-outline", color: "#4F46E5", tint: "#EEF2FF" },
  "Core Engineering": { icon: "cog-outline", color: "#EA580C", tint: "#FFF7ED" },
  "Data/AI": { icon: "analytics-outline", color: "#0891B2", tint: "#ECFEFF" },
  Design: { icon: "color-palette-outline", color: "#DB2777", tint: "#FDF2F8" },
  Marketing: { icon: "megaphone-outline", color: "#D97706", tint: "#FFFBEB" },
  Sales: { icon: "trending-up-outline", color: "#16A34A", tint: "#F0FDF4" },
  Finance: { icon: "cash-outline", color: "#0D9488", tint: "#F0FDFA" },
  HR: { icon: "people-outline", color: "#7C3AED", tint: "#F5F3FF" },
  Other: { icon: "briefcase-outline", color: "#64748B", tint: "#F1F5F9" },
};

/** Unknown categories fall back to the "Other" style. */
export function categoryStyle(name: string): CategoryStyle {
  return CATEGORY_STYLES[name] ?? CATEGORY_STYLES.Other;
}

export interface CategoryRow {
  category: string;
  jobCount: number;
}

/**
 * Merges real counts into the fixed set. Categories with jobs come first
 * (count desc, ties in fixed order), then the zero-count fixed ones in fixed
 * order. "Other" only appears when it has jobs; any category the DB returns
 * that isn't in the set is folded into "Other".
 */
export function buildCategoryRows(counts: JobCategoryCount[] | undefined): CategoryRow[] {
  const tally = new Map<string, number>();
  for (const { category, jobCount } of counts ?? []) {
    const key = ALL_CATEGORY_NAMES.includes(category) ? category : OTHER_CATEGORY;
    tally.set(key, (tally.get(key) ?? 0) + jobCount);
  }
  const rows: CategoryRow[] = ALL_CATEGORY_NAMES.map((category) => ({ category, jobCount: tally.get(category) ?? 0 }));
  const visible = rows.filter((r) => r.category !== OTHER_CATEGORY || r.jobCount > 0);
  const order = (r: CategoryRow) => ALL_CATEGORY_NAMES.indexOf(r.category);
  const withJobs = visible.filter((r) => r.jobCount > 0).sort((a, b) => b.jobCount - a.jobCount || order(a) - order(b));
  const empty = visible.filter((r) => r.jobCount === 0).sort((a, b) => order(a) - order(b));
  return [...withJobs, ...empty];
}

/** 1200 → "1.2k", 1000 → "1k", 999 → "999". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

/** "1 Job" / "12 Jobs" / "1.2k Jobs". */
export function formatJobCount(n: number): string {
  return `${formatCount(n)} ${n === 1 ? "Job" : "Jobs"}`;
}

/** Stat pills only appear once there is enough real data to not look empty. */
export const MIN_JOBS_FOR_STATS = 10;

export function heroStatPills(stats: JobDashboardStats | undefined): string[] {
  if (!stats || stats.activeJobs < MIN_JOBS_FOR_STATS) return [];
  const pills = [`${formatCount(stats.activeJobs)} Active Jobs`];
  if (stats.companyCount > 0) pills.push(`${formatCount(stats.companyCount)} ${stats.companyCount === 1 ? "Company" : "Companies"}`);
  if (stats.fresherJobs > 0) pills.push(`${formatCount(stats.fresherJobs)} Fresher Jobs`);
  return pills;
}

/** "Flex (Flextronics)" → "FF"; single word → first two letters. */
export function companyInitials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}
