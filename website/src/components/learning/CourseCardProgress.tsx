"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { useLearningProgress } from "@/lib/learningProgress";

/** Device-only progress; the parent course link supplies the action target. */
export function CourseCardProgress({ gridSlug, totalLessons }: { gridSlug: string; totalLessons: number }) {
  const { ready, courseProgress } = useLearningProgress();
  const p = courseProgress(gridSlug, totalLessons);
  const done = ready && p.total > 0 && p.completed >= p.total;
  const percent = ready ? p.percent : 0;
  const action = ready && p.completed > 0 ? "Continue" : "Start";
  return (
    <div className="course-card-progress mt-2 flex min-w-0 items-center gap-2">
      <div className={`course-card-meter min-w-0 flex-1 ${percent > 0 ? "" : "course-card-meter-empty"}`}>
        <div className="mb-1 flex items-center justify-between gap-2 text-xs tabular-nums text-ink-muted">
          <span>{done ? "Completed" : "Progress"}</span>
          <span>{percent}%</span>
        </div>
        <ProgressBar
          value={ready ? p.completed : 0}
          max={p.total || 1}
          label={ready ? `${p.completed} of ${p.total} lessons done` : "Course progress"}
          size="xs"
          tone={done ? "success" : "primary"}
          className="[&_[role=progressbar]>div]:bg-primary [&_[role=progressbar]>div]:bg-none"
        />
      </div>
      <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-white">
        {action}
      </span>
    </div>
  );
}

export default CourseCardProgress;
