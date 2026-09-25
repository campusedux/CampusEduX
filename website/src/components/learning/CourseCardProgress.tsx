"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLearningProgress } from "@/lib/learningProgress";

/**
 * Per-course progress strip for a course card. Device-only progress; renders
 * nothing until the stored state is readable, or when the course isn't started.
 */
export function CourseCardProgress({ gridSlug, totalLessons }: { gridSlug: string; totalLessons: number }) {
  const { ready, courseProgress } = useLearningProgress();
  if (!ready) return null;
  const p = courseProgress(gridSlug, totalLessons);
  if (!p.started) return null;
  return (
    <div className="mt-3">
      <ProgressBar value={p.completed} max={p.total || 1} label={`${p.completed} of ${p.total} lessons done`} size="xs" />
      <p className="mt-1.5 text-xs font-medium text-ink-muted">
        {p.completed > 0 ? `${p.completed} of ${p.total} lessons done` : "In progress"}
      </p>
    </div>
  );
}

export default CourseCardProgress;
