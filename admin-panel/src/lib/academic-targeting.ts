import { createClient } from '@/lib/supabase/server';
import { getCourses, getBranches, getAcademicYears } from '@/lib/settings/queries';

/**
 * Options for the "Target audience" control on the project / job / note forms.
 * Only active rows are offered. Branches carry `course_id` so the picker can
 * show just the branches of the chosen course (spec §9, §26, §36).
 */
export interface AcademicOptions {
  courses: { id: string; name: string }[];
  branches: { id: string; name: string; course_id: string | null }[];
  years: { id: string; label: string }[];
}

export async function getAcademicOptions(): Promise<AcademicOptions> {
  const [courses, branches, years] = await Promise.all([getCourses(), getBranches(), getAcademicYears()]);
  const active = (r: { status?: string }) => r.status !== 'inactive';
  return {
    courses: (courses as any[]).filter(active).map((c) => ({ id: c.id, name: c.name })),
    branches: (branches as any[])
      .filter(active)
      .map((b) => ({ id: b.id, name: b.name, course_id: b.course_id ?? null })),
    years: (years as any[]).filter(active).map((y) => ({ id: y.id, label: y.label })),
  };
}

/**
 * The targeting columns on projects / jobs / prep_notes:
 *   * target_type            'global' | 'course' | 'branch'   (migration 0035)
 *   * target_course_id/name  the course a 'course' / 'branch' row belongs to
 *   * target_branch_ids/names the branches a 'branch' row is aimed at (0035)
 *   * target_branch_id/name   [0] of the arrays — kept for back-compat with 011
 *   * target_year_id/label    an optional, independent "also limit to year"
 */
export interface TargetingColumns {
  target_type: string;
  target_course_id: string | null;
  target_branch_id: string | null;
  target_year_id: string | null;
  target_course_name: string | null;
  target_branch_name: string | null;
  target_year_label: string | null;
  target_branch_ids: string[];
  target_branch_names: string[];
}

const pick = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? '').trim();
  return v.length ? v : null;
};

/**
 * Reads the "Target audience" radio + its dependent selects from a submitted
 * form and resolves ids to display names (the mobile app matches on the
 * student's free-text course / branch / year, and RLS reads target_branch_ids).
 *
 * Returns a patch to spread into an insert/update. Returns `{}` untouched when
 * the form carries no targeting fields at all. Requires migration 0035 (adds
 * target_type + target_branch_ids); the admin panel treats it as required, the
 * same way it already requires 001–014.
 */
export async function resolveTargetingFromForm(fd: FormData): Promise<Partial<TargetingColumns>> {
  const present =
    fd.has('target_type') ||
    fd.has('target_course_id') ||
    fd.has('target_branch_id') ||
    fd.has('target_branch_ids') ||
    fd.has('target_year_id');
  if (!present) return {};

  const requestedType = (pick(fd, 'target_type') ?? 'global') as 'global' | 'course' | 'branch';
  const rawCourseId = pick(fd, 'target_course_id');
  const yearId = pick(fd, 'target_year_id');
  const branchIds = fd
    .getAll('target_branch_ids')
    .map((v) => String(v).trim())
    .filter(Boolean);

  const supabase = createClient();

  let courseId: string | null = null;
  let branchNames: string[] = [];
  // Branch ids kept after dropping any that don't belong to the chosen course —
  // a cross-course combination (spec §28, e.g. Course=MBA + Branch=CSE) is
  // invalid and is also rejected by the DB trigger from migration 0036. This
  // keeps the saved row self-consistent instead of silently adopting the first
  // branch's course.
  let cleanBranchIds = branchIds;

  if (requestedType === 'branch' && branchIds.length) {
    const { data } = await supabase.from('branches').select('id, name, course_id').in('id', branchIds);
    const rows = (data ?? []) as { id: string; name: string; course_id: string | null }[];
    const authoritativeCourseId = rawCourseId ?? rows[0]?.course_id ?? null;
    cleanBranchIds = branchIds.filter((id) => {
      const row = rows.find((r) => r.id === id);
      return row ? row.course_id === authoritativeCourseId : false;
    });
    branchNames = cleanBranchIds.map((id) => rows.find((r) => r.id === id)?.name ?? '').filter(Boolean);
    courseId = authoritativeCourseId;
  } else if (requestedType === 'course') {
    courseId = rawCourseId;
  }

  // Fall back to 'global' when the chosen type has nothing selected (or every
  // selected branch was dropped as cross-course).
  const type: 'global' | 'course' | 'branch' =
    requestedType === 'branch' && cleanBranchIds.length === 0
      ? 'global'
      : requestedType === 'course' && !courseId
        ? 'global'
        : requestedType;

  let courseName: string | null = null;
  if (type !== 'global' && courseId) {
    const { data } = await supabase.from('courses').select('name').eq('id', courseId).maybeSingle();
    courseName = (data as { name?: string } | null)?.name ?? null;
  }

  let yearLabel: string | null = null;
  if (yearId) {
    const { data } = await supabase.from('academic_years').select('label').eq('id', yearId).maybeSingle();
    yearLabel = (data as { label?: string } | null)?.label ?? null;
  }

  const isBranch = type === 'branch';
  return {
    target_type: type,
    target_course_id: type === 'global' ? null : courseId,
    target_course_name: type === 'global' ? null : courseName,
    target_branch_ids: isBranch ? cleanBranchIds : [],
    target_branch_names: isBranch ? branchNames : [],
    target_branch_id: isBranch ? cleanBranchIds[0] ?? null : null,
    target_branch_name: isBranch ? branchNames[0] ?? null : null,
    target_year_id: yearId,
    target_year_label: yearLabel,
  };
}
