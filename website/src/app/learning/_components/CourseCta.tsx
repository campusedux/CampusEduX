"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, CheckCircle2, ListChecks, PlayCircle, RotateCcw } from "lucide-react";
import { useLearningProgress } from "@/lib/learningProgress";
import { useLearningBookmarks } from "@/lib/useLearningBookmarks";
import { findLesson, type CourseOutline } from "@/lib/courseOutline";
import { ProgressRing } from "@/components/ui/ProgressRing";

type Target = { slug: string; title: string; label: string; icon: typeof PlayCircle };

/**
 * Course call-to-action: a sticky card beside the curriculum on desktop and a
 * fixed bar above the tab bar on phones. Resumes the last lesson opened in THIS
 * course, else the first incomplete one. Also reconciles stored progress with
 * the live lesson list, so a renamed/deleted lesson never becomes a dead link.
 *
 * Server/first render = "Start course" (the stored state isn't readable yet).
 */
export function CourseCta({ outline, courseTest }: { outline: CourseOutline; courseTest: { id: string; title: string } | null }) {
  const progress = useLearningProgress();
  const bookmarks = useLearningBookmarks();
  const { gridSlug, order } = outline;

  useEffect(() => {
    if (progress.ready) progress.reconcileCourse(gridSlug, order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.ready, gridSlug]);

  if (order.length === 0) return null;

  const first = findLesson(outline, order[0])!.lesson;
  const p = progress.courseProgress(gridSlug, outline.total);
  const last = progress.ready ? progress.state.courses[gridSlug]?.lastVisited : undefined;
  const lastLesson = last ? findLesson(outline, last.topicSlug)?.lesson : undefined;
  const nextSlug = progress.ready ? progress.firstIncomplete(gridSlug, order) : null;
  const nextLesson = nextSlug ? findLesson(outline, nextSlug)?.lesson : undefined;
  const allDone = progress.ready && p.completed >= outline.total;

  let target: Target = { slug: first.slug, title: first.title, label: "Start course", icon: PlayCircle };
  if (allDone) target = { slug: first.slug, title: first.title, label: "Review course", icon: RotateCcw };
  else if (lastLesson) target = { slug: lastLesson.slug, title: lastLesson.title, label: "Continue", icon: PlayCircle };
  else if (p.started && nextLesson) target = { slug: nextLesson.slug, title: nextLesson.title, label: "Continue", icon: PlayCircle };

  const href = `/learning/${gridSlug}/${target.slug}`;
  const Icon = target.icon;
  const saved = outline.sections.flatMap((s) => s.lessons).filter((l) => bookmarks.has(l.id));

  return (
    <>
      {/* Desktop / tablet card */}
      <div className="card hidden p-5 lg:block">
        {/* Ring + counts: the card's focal point. 0% until the stored progress is readable. */}
        <div className="flex items-center gap-4">
          <ProgressRing
            value={progress.ready ? p.completed : 0}
            max={outline.total}
            label="Course progress"
            tone={allDone ? "success" : "primary"}
          />
          <div className="min-w-0">
            {allDone ? (
              <p className="flex items-center gap-1.5 font-display text-lg font-bold text-success">
                <CheckCircle2 className="h-5 w-5" aria-hidden /> Course complete
              </p>
            ) : (
              <p className="font-display text-lg font-bold text-ink">{progress.ready && p.started ? "Your progress" : "Ready to start?"}</p>
            )}
            <p className="mt-1 text-sm text-ink-muted">
              <span className="font-semibold tabular-nums text-ink">{progress.ready ? p.completed : 0}</span> of{" "}
              <span className="tabular-nums">{outline.total}</span> lessons done
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">Saved on this device</p>
          </div>
        </div>
        <Link href={href} className="btn-primary mt-5 h-12 w-full">
          <Icon className="h-4 w-4" aria-hidden />
          {target.label}
        </Link>
        {target.label === "Continue" && (
          <p className="mt-2 truncate text-center text-xs text-ink-muted" title={target.title}>
            {target.title}
          </p>
        )}
        {courseTest && (
          <Link href={`/mock-tests/${courseTest.id}`} className="btn-ghost mt-3 w-full">
            <ListChecks className="h-4 w-4" aria-hidden />
            {courseTest.title}
          </Link>
        )}

        {saved.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
              <Bookmark className="h-3.5 w-3.5" aria-hidden /> Saved in this course
            </p>
            <ul className="mt-2 space-y-0.5">
              {saved.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/learning/${gridSlug}/${l.slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink transition hover:bg-surface hover:text-primary"
                  >
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Phone: fixed bar above the bottom tab bar (tab bar is md:hidden) */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-line/70 bg-card/95 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            {progress.ready && p.started ? (
              <>
                <p className="truncate text-xs text-ink-muted">
                  {p.completed}/{outline.total} lessons · {p.percent}%
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet" style={{ width: `${p.percent}%` }} />
                </div>
              </>
            ) : (
              <p className="truncate text-sm font-semibold text-ink">{outline.gridName}</p>
            )}
          </div>
          <Link href={href} className="btn-primary h-11 flex-shrink-0 px-5">
            <Icon className="h-4 w-4" aria-hidden />
            {target.label}
          </Link>
        </div>
      </div>
    </>
  );
}

export default CourseCta;
