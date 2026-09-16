/**
 * Pure types + helpers for the global Practice → Coding Problems section.
 * No React / server imports, so this is safe to unit-test and to import from
 * client components.
 *
 * Practice problems are `dsa_problems` rows with `learning_topic_id IS NULL` and
 * `topic_id` -> a `dsa_topics` row of `kind='practice'` (migration 0072/044).
 * They reuse the same workspace UI + compiler as the Learning topic coding
 * problems, but live under `/practice/*` and never touch Learning.
 */
import type { CodingProblemDetail } from "@/lib/learning.types";

export type { CodingProblemDetail } from "@/lib/learning.types";

export const PRACTICE_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];

/** Languages every practice problem is authored for — mirrors the compiler registry. */
export const PRACTICE_LANGUAGES = ["java", "python", "c", "cpp", "javascript"] as const;
export const PRACTICE_LANGUAGE_LABEL: Record<string, string> = {
  java: "Java",
  python: "Python",
  c: "C",
  cpp: "C++",
  javascript: "JavaScript",
};

export const PRACTICE_PAGE_SIZE = 24;

/** Breadcrumb for the practice problem workspace (passed to `ProblemPanel`),
 *  with the current problem's own title as the final, unlinked crumb. */
export function practiceCrumbs(problemTitle: string): { label: string; href?: string }[] {
  return [
    { label: "Practice", href: "/practice" },
    { label: "Coding Problems", href: "/practice/problems" },
    { label: problemTitle },
  ];
}

export const DIFFICULTY_PILL_CLASS: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-700",
};

export interface PracticeCategory {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  problem_count: number;
}

export interface PracticeProblemCard {
  /** `dsa_problems.id` — used only to join per-viewer solved state client-side. */
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category_slug: string;
  category_name: string;
  supported_languages: string[];
  is_premium: boolean;
}

export interface PracticeProblemsPage {
  total: number;
  items: PracticeProblemCard[];
}

/** Detail payload — structurally a `CodingProblemDetail` (so the shared
 *  `CodingProblemBody` renders it unchanged) plus the practice `category`.
 *  `topic.grid_slug` / `topic.topic_slug` are empty strings for practice; the
 *  workspace is given an explicit `nav` so those are never rendered. */
export interface PracticeProblemDetail extends CodingProblemDetail {
  category: { slug: string; name: string };
}

export type SolvedFilter = "solved" | "unsolved";

export interface PracticeQuery {
  difficulty?: PracticeDifficulty;
  category?: string;
  lang?: string;
  q?: string;
  status?: SolvedFilter;
  page: number;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = (s ?? "").trim();
  return t ? t : undefined;
}

/** Parse + sanitise the `/practice/problems` query string. Pure. */
export function parsePracticeQuery(sp: Record<string, string | string[] | undefined>): PracticeQuery {
  const rawDiff = one(sp.difficulty)?.toLowerCase();
  const difficulty = PRACTICE_DIFFICULTIES.find((d) => d.toLowerCase() === rawDiff);

  const rawCat = one(sp.category)?.toLowerCase();
  const category = rawCat && SLUG_RE.test(rawCat) ? rawCat : undefined;

  const rawLang = one(sp.lang)?.toLowerCase();
  const lang = (PRACTICE_LANGUAGES as readonly string[]).includes(rawLang ?? "") ? rawLang : undefined;

  const rawQ = one(sp.q);
  const q = rawQ ? rawQ.slice(0, 80) : undefined;

  const rawStatus = one(sp.status)?.toLowerCase();
  const status: SolvedFilter | undefined =
    rawStatus === "solved" || rawStatus === "unsolved" ? rawStatus : undefined;

  const pageNum = Number.parseInt(one(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.min(pageNum, 10000) : 1;

  return { difficulty, category, lang, q, status, page };
}

/** URL search params for a query, dropping empties — for pagination / chip links. */
export function practiceParams(query: Partial<PracticeQuery>): Record<string, string> {
  const out: Record<string, string> = {};
  if (query.difficulty) out.difficulty = query.difficulty;
  if (query.category) out.category = query.category;
  if (query.lang) out.lang = query.lang;
  if (query.q) out.q = query.q;
  if (query.status) out.status = query.status;
  if (query.page && query.page > 1) out.page = String(query.page);
  return out;
}

export function totalPages(total: number, pageSize = PRACTICE_PAGE_SIZE): number {
  return Math.max(1, Math.ceil((total || 0) / pageSize));
}
