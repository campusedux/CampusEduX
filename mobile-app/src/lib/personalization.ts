import type { UserProfile } from "@/types";

/**
 * The student's academic profile, as stored today: three free-text values on
 * the `profiles` row (course / branch / year). Any of them may be missing.
 */
export interface AcademicProfile {
  course: string | null;
  branch: string | null;
  year: string | null;
}

/**
 * Academic-targeting columns present on projects / jobs / prep_notes rows.
 * `target_type` + `target_branch_names[]` come from migration 0035; the scalar
 * `target_*_name` columns from 0031 / 011 are still read as a fallback for rows
 * saved before 0035. A row with type 'global' (or no signal at all) is content
 * everyone sees.
 *
 * Authorization is enforced server-side by RLS (migration 0036): a student only
 * ever receives GLOBAL rows, COURSE rows for their course, and BRANCH rows for
 * their branch. This client-side scoring therefore only decides *ordering* of
 * already-authorised rows (spec §16) — the negative branches below are reached
 * only in unauthenticated / admin contexts where RLS lets more through.
 */
export interface AcademicTargeting {
  target_type?: string | null;
  target_course_name?: string | null;
  target_branch_name?: string | null;
  target_branch_names?: string[] | null;
  target_year_label?: string | null;
}

/** Every branch label a row is aimed at (new array ?? legacy scalar). */
function branchTargets(row: AcademicTargeting): string[] {
  const list = Array.isArray(row.target_branch_names) ? row.target_branch_names : [];
  const merged = list.length > 0 ? list : row.target_branch_name ? [row.target_branch_name] : [];
  return merged.map((b) => norm(b)).filter((b) => b.length > 0);
}

export function academicFromUser(user: UserProfile | null | undefined): AcademicProfile {
  return {
    course: user?.course ?? null,
    branch: user?.branch ?? null,
    year: user?.year ?? null,
  };
}

/** True when we know nothing about the student — personalization is a no-op. */
export function hasAcademicSignal(p: AcademicProfile): boolean {
  return !!(p.course || p.branch || p.year);
}

/** A stable string for react-query keys so the cache is per academic profile. */
export function academicKey(p: AcademicProfile): string {
  return `${norm(p.course)}|${norm(p.branch)}|${norm(p.year)}`;
}

function norm(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

function eq(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = norm(a);
  return x.length > 0 && x === norm(b);
}

/**
 * Relevance score for one targeted row against the student's profile.
 * Higher = show first. The ordering encodes the spec's priority ladder
 * (§27): Course+Branch+Year › Course+Branch › Branch › Course › Global,
 * and pushes content aimed at a *different* branch/course below global
 * content instead of hiding it (§25, §26).
 */
export function academicScore(row: AcademicTargeting, p: AcademicProfile): number {
  const branches = branchTargets(row);
  const hasBranchTarget = row.target_type === "branch" || branches.length > 0;
  const hasCourseTarget = row.target_type === "course" || norm(row.target_course_name).length > 0;
  const hasYearTarget = norm(row.target_year_label).length > 0;

  if (row.target_type === "global" || (!hasBranchTarget && !hasCourseTarget && !hasYearTarget)) {
    return 10; // global content — the always-available fallback
  }

  const branchMatch = branches.length > 0 && branches.some((b) => b === norm(p.branch));
  const courseMatch = hasCourseTarget && eq(row.target_course_name, p.course);
  const yearMatch = hasYearTarget && eq(row.target_year_label, p.year);

  let score = 0;
  if (branchMatch) score += 100;
  if (courseMatch) score += 20;
  if (yearMatch) score += 5;

  // Targeted at someone else — keep it, but below globals (mostly unreachable
  // now that RLS hides other branches' branch-specific rows).
  if (hasBranchTarget && !branchMatch) score -= 60;
  if (hasCourseTarget && !courseMatch && !branchMatch) score -= 15;

  return score;
}

/** Subtitle for a "nothing here" state, tailored to the student's profile. */
export function academicEmptyText(p: AcademicProfile, noun: string): string {
  if (p.branch) return `No ${noun} for ${p.branch} yet — check back soon.`;
  if (p.course) return `No ${noun} for ${p.course} yet — check back soon.`;
  return `No ${noun} available right now.`;
}

/**
 * Re-orders rows by academic relevance while preserving the caller's original
 * ordering (e.g. sales_count / created_at) for equally-relevant rows. Never
 * drops a row — a student always sees a full list, just re-prioritised. When
 * the profile carries no academic data the input is returned untouched.
 */
export function rankByAcademicRelevance<T extends AcademicTargeting>(
  rows: T[],
  p: AcademicProfile
): T[] {
  if (!hasAcademicSignal(p) || rows.length < 2) return rows;
  return rows
    .map((row, index) => ({ row, index, score: academicScore(row, p) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.row);
}
