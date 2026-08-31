import { supabase } from "@/lib/supabase";
import { COURSES, BRANCHES, YEARS } from "@/constants";

/**
 * One selectable academic value. `label` is what gets persisted on
 * profiles.course / branch / year (free text — same as before). `id` is only
 * used as a React key. `icon` is optional (course tiles show one).
 * `courseId` is set on branch options so a branch picker can show only the
 * branches of the chosen course (spec §9, §36).
 */
export interface AcademicOption {
  id: string;
  label: string;
  icon?: string;
  courseId?: string;
}

// Offline / pre-migration fallback — the lists the app has always shipped with.
const FALLBACK_COURSES: AcademicOption[] = COURSES.map((c) => ({ id: c.id, label: c.label, icon: c.icon }));
const FALLBACK_BRANCHES: AcademicOption[] = BRANCHES.map((b) => ({ id: b, label: b, icon: "git-branch-outline" }));
const FALLBACK_YEARS: AcademicOption[] = YEARS.map((y) => ({ id: y, label: y, icon: "calendar-outline" }));

async function fromTable(
  table: "courses" | "branches" | "academic_years",
  labelColumn: "name" | "label",
  icon: string,
  fallback: AcademicOption[]
): Promise<AcademicOption[]> {
  try {
    const withCourse = table === "branches";
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${labelColumn}, status, sort_order${withCourse ? ", course_id" : ""}`)
      .neq("status", "inactive")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data ?? [])
      .map((r: any) => ({
        id: String(r.id),
        label: String(r[labelColumn] ?? "").trim(),
        icon,
        ...(withCourse && r.course_id ? { courseId: String(r.course_id) } : {}),
      }))
      .filter((r) => r.label.length > 0);
    return rows.length > 0 ? rows : fallback;
  } catch (err) {
    console.info(`[academic.service] ${table}: using bundled list (${(err as Error).message})`);
    return fallback;
  }
}

/**
 * Reads the academic vocabulary the admin panel manages (courses / branches /
 * academic_years — all have public SELECT policies), so a student picks from
 * the exact same names an admin uses when targeting content. Falls back to the
 * bundled lists when those tables are empty or unreachable.
 */
export const academicService = {
  getCourses: () => fromTable("courses", "name", "school-outline", FALLBACK_COURSES),

  /**
   * All active branches, or — when `courseId` is given and the catalog is
   * populated — just that course's branches. On the bundled fallback (no
   * course_id on any row) the whole list is returned so a student is never
   * left without a branch to pick.
   */
  async getBranches(courseId?: string): Promise<AcademicOption[]> {
    const all = await fromTable("branches", "name", "git-branch-outline", FALLBACK_BRANCHES);
    if (!courseId) return all;
    const catalogHasCourses = all.some((b) => b.courseId);
    if (!catalogHasCourses) return all; // bundled fallback — not course-aware
    return all.filter((b) => b.courseId === courseId);
  },

  getYears: () => fromTable("academic_years", "label", "calendar-outline", FALLBACK_YEARS),
};
