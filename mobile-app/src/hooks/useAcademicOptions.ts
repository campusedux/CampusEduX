import { useQuery } from "@tanstack/react-query";
import { academicService, type AcademicOption } from "@/services/academic.service";

export const academicOptionKeys = {
  courses: ["academic", "courses"] as const,
  branches: (courseId = "all") => ["academic", "branches", courseId] as const,
  years: ["academic", "years"] as const,
};

// Academic vocab changes rarely — cache it for the session.
const STATIC = { staleTime: 1000 * 60 * 60, gcTime: 1000 * 60 * 60 };

export const useCourseOptions = () =>
  useQuery({ queryKey: academicOptionKeys.courses, queryFn: academicService.getCourses, ...STATIC });

/** Branches, optionally narrowed to one course (spec §9, §36). */
export const useBranchOptions = (courseId?: string) =>
  useQuery({
    queryKey: academicOptionKeys.branches(courseId ?? "all"),
    queryFn: () => academicService.getBranches(courseId),
    ...STATIC,
  });

export const useYearOptions = () =>
  useQuery({ queryKey: academicOptionKeys.years, queryFn: academicService.getYears, ...STATIC });

/** Resolve a stored course *label* (free text on the profile) to its catalog id. */
export function courseIdForLabel(options: AcademicOption[], label: string | null | undefined): string | undefined {
  if (!label) return undefined;
  const norm = label.trim().toLowerCase();
  return options.find((c) => c.label.trim().toLowerCase() === norm)?.id;
}
