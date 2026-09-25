"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLearningProgress } from "@/lib/learningProgress";

/**
 * Per-course progress row for a course card: bar + "X% complete" / "Not
 * started". Device-only progress. Until the stored state is readable, it
 * renders an empty bar of the same height, so cards never shift.
 */
export function CourseCardProgress({ gridSlug, totalLessons }: { gridSlug: string; totalLessons: number }) {
  const { ready, courseProgress } = useLearningProgress();
  const p = courseProgress(gridSlug, totalLessons);
  const done = ready && p.total > 0 && p.completed >= p.total;
  const text = !ready ? " " : done ? "Completed" : p.completed > 0 ? `${p.percent}% complete` : p.started ? "Started" : "Not started";
  return (
    <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
      <ProgressBar
        value={ready ? p.completed : 0}
        max={p.total || 1}
        label={ready ? `${p.completed} of ${p.total} lessons done` : "Course progress"}
        size="xs"
        tone={done ? "success" : "primary"}
        className="flex-1"
      />
      <span
        className={`min-w-[5.5rem] text-right text-xs font-semibold tabular-nums ${done ? "text-success" : p.completed > 0 ? "text-primary" : "text-ink-faint"}`}
      >
        {text}
      </span>
    </div>
  );
}

export default CourseCardProgress;
