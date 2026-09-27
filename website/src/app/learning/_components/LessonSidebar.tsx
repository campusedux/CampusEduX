"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLearningProgress } from "@/lib/learningProgress";
import type { CourseOutline } from "@/lib/courseOutline";

/**
 * Lesson-page navigation: course title + progress, then sections as native
 * <details> (current section open) with completed ticks and premium locks.
 * Used in the sticky desktop rail and inside the phone "Contents" drawer.
 */
export function LessonSidebar({
  outline,
  currentSlug,
  onNavigate,
}: {
  outline: CourseOutline;
  currentSlug: string;
  onNavigate?: () => void;
}) {
  const progress = useLearningProgress();
  const { gridSlug } = outline;
  const currentSectionId = outline.sections.find((s) => s.lessons.some((l) => l.slug === currentSlug))?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(currentSectionId ? [currentSectionId] : []));
  const p = progress.courseProgress(gridSlug, outline.total);

  return (
    <nav aria-label="Course contents" className="text-sm">
      <Link prefetch={false}
        href={`/learning/${gridSlug}`}
        onClick={onNavigate}
        className="block rounded-xl px-2.5 py-2 font-display text-base font-bold leading-snug text-ink transition hover:bg-surface hover:text-primary"
      >
        {outline.gridName}
      </Link>
      <div className="px-2.5 pb-4 pt-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet transition-[width] duration-500"
            style={{ width: `${progress.ready ? p.percent : 0}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          {progress.ready ? `${p.completed} of ${outline.total} lessons done` : `${outline.total} lessons`}
        </p>
      </div>

      <div className="space-y-1">
        {outline.sections.map((s) => {
          const completed = progress.ready ? s.lessons.filter((l) => progress.isComplete(gridSlug, l.slug)).length : 0;
          const isOpen = open.has(s.id);
          return (
            <details
              key={s.id}
              open={isOpen}
              onToggle={(e) => {
                const now = (e.currentTarget as HTMLDetailsElement).open;
                setOpen((prev) => {
                  if (prev.has(s.id) === now) return prev;
                  const next = new Set(prev);
                  if (now) next.add(s.id);
                  else next.delete(s.id);
                  return next;
                });
              }}
              className="group/sec"
            >
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-surface [&::-webkit-details-marker]:hidden",
                  s.id === currentSectionId ? "text-ink" : "text-ink-muted",
                )}
              >
                <span className="min-w-0 flex-1 text-xs font-bold uppercase tracking-[0.08em]">{s.name}</span>
                <span className="flex-shrink-0 text-[11px] tabular-nums text-ink-faint">
                  {completed > 0 ? `${completed}/` : ""}
                  {s.lessons.length}
                </span>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint transition-transform group-open/sec:rotate-180" aria-hidden />
              </summary>
              <ol className="mb-2 ml-2.5 mt-0.5 space-y-0.5 border-l border-line">
                {s.lessons.map((l) => {
                  const active = l.slug === currentSlug;
                  const done = progress.ready && progress.isComplete(gridSlug, l.slug);
                  return (
                    <li key={l.id}>
                      <Link prefetch={false}
                        href={`/learning/${gridSlug}/${l.slug}`}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "-ml-px flex items-center gap-2 rounded-r-lg border-l-[3px] py-1.5 pl-3 pr-2 leading-snug transition-colors",
                          // primary-50 is nearly the page colour in dark mode, so the active tint is an alpha of primary.
                          active
                            ? "border-primary bg-primary/10 font-semibold text-primary dark:bg-primary/25 dark:text-white"
                            : "border-transparent text-ink-muted hover:border-line hover:bg-surface hover:text-ink",
                        )}
                      >
                        <span className="min-w-0 flex-1">{l.title}</span>
                        {done ? (
                          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-success text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-label="Completed" />
                          </span>
                        ) : l.isPremium ? (
                          <Lock className="h-3 w-3 flex-shrink-0 text-amber-500" aria-label="Premium" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
    </nav>
  );
}

export default LessonSidebar;
