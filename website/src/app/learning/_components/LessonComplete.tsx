"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Flame, GraduationCap, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLearningProgress, type LessonRef } from "@/lib/learningProgress";
import { toast } from "@/components/ui/Toast";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Celebration, type CelebrationKind } from "./Celebration";

interface Props {
  lesson: LessonRef;
  /** Slugs of every lesson in this lesson's section / the whole course (reading order). */
  sectionSlugs: string[];
  courseSlugs: string[];
  next: { slug: string; title: string; sectionName?: string } | null;
  variant: "compact" | "card";
}

/**
 * "Mark as complete" — device-only progress via useLearningProgress.
 * - `compact`: small toggle in the lesson header.
 * - `card`: end-of-lesson card with today's goal, and the next step once done.
 * Completing the last lesson of a section / course opens <Celebration>; every
 * completion toasts the daily-goal update.
 */
export function LessonComplete({ lesson, sectionSlugs, courseSlugs, next, variant }: Props) {
  const progress = useLearningProgress();
  const [celebrate, setCelebrate] = useState<CelebrationKind | null>(null);
  const { gridSlug, topicSlug } = lesson;

  if (!progress.ready) {
    // Same box as the compact button below (`h-11 sm:h-9`, ~"Mark as complete"
    // width) so the lesson header row doesn't grow on mobile and shift the
    // article when local progress loads.
    return variant === "compact" ? (
      <span className="inline-block h-11 w-[10.25rem] animate-pulse rounded-xl bg-surface sm:h-9" aria-hidden />
    ) : null;
  }

  const done = progress.isComplete(gridSlug, topicSlug);
  const othersDone = (slugs: string[]) => slugs.every((s) => s === topicSlug || progress.isComplete(gridSlug, s));

  const complete = () => {
    if (done) return;
    const finishesCourse = othersDone(courseSlugs);
    const finishesSection = !finishesCourse && sectionSlugs.length > 1 && othersDone(sectionSlugs);
    const { completedToday, goal, met } = progress.today;
    progress.markComplete(lesson);

    const nowToday = completedToday + 1;
    if (!met && nowToday >= goal) {
      toast({ tone: "success", title: "Daily goal reached!", description: `${nowToday} lesson${nowToday === 1 ? "" : "s"} today — see you tomorrow.` });
    } else {
      toast({
        tone: "success",
        title: "Lesson complete",
        description: met ? `${nowToday} lessons today — beyond your goal.` : `${nowToday}/${goal} of today's goal done.`,
      });
    }
    if (finishesCourse) setCelebrate("course");
    else if (finishesSection) setCelebrate("section");
  };

  const undo = () => progress.markIncomplete(gridSlug, topicSlug);
  const nextHref = next ? `/learning/${gridSlug}/${next.slug}` : `/learning/${gridSlug}`;

  const celebration = celebrate && (
    <Celebration
      kind={celebrate}
      name={celebrate === "course" ? lesson.gridName : lesson.sectionName ?? lesson.gridName}
      open
      onClose={() => setCelebrate(null)}
      next={
        celebrate === "course"
          ? { href: "/learning", label: "Explore more courses" }
          : next
            ? { href: nextHref, label: "Start the next section" }
            : { href: `/learning/${gridSlug}`, label: "Back to course" }
      }
    />
  );

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={done ? undo : complete}
          aria-pressed={done}
          className={cn(
            "inline-flex h-11 items-center gap-1.5 rounded-xl px-3.5 text-[0.8rem] font-semibold transition sm:h-9",
            done ? "bg-success/15 text-success hover:bg-success/20" : "border border-line bg-card text-ink hover:border-success/40 hover:text-success",
          )}
        >
          {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          {done ? "Completed" : "Mark as complete"}
        </button>
        {celebration}
      </>
    );
  }

  const { completedToday, goal, met } = progress.today;
  return (
    <section
      aria-label="Lesson progress"
      className={cn(
        "mt-10 overflow-hidden rounded-3xl border p-5 sm:p-6",
        done ? "border-success/30 bg-success/[0.06]" : "border-line bg-card shadow-card",
      )}
    >
      {!done ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-ink">Finished this lesson?</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Mark it complete to track your progress{goal ? ` — ${completedToday}/${goal} done today` : ""}.
            </p>
          </div>
          <button type="button" onClick={complete} className="btn-primary h-12 flex-shrink-0 px-6">
            <Check className="h-4 w-4" aria-hidden /> Mark as complete
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-success">
              <CheckCircle2 className="h-5 w-5" aria-hidden /> Lesson complete
            </p>
            <button type="button" onClick={undo} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink">
              <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Flame className="h-3.5 w-3.5 text-warning" aria-hidden />
                Today: {completedToday}/{goal} lesson{goal === 1 ? "" : "s"}
                {met ? " · goal reached" : ""}
                {progress.streak.current > 1 ? ` · ${progress.streak.current}-day streak` : ""}
              </p>
              <ProgressBar value={completedToday} max={goal} label="Today's goal" tone={met ? "success" : "primary"} />
            </div>
            {next ? (
              <Link href={nextHref} className="btn-primary h-12 px-6">
                Up next: {next.title.length > 36 ? `${next.title.slice(0, 34)}…` : next.title}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <Link href="/learning" className="btn-primary h-12 px-6">
                <GraduationCap className="h-4 w-4" aria-hidden /> Explore more courses
              </Link>
            )}
          </div>
          {!next && (
            <p className="mt-3 text-sm text-ink-muted">
              That was the last lesson.{" "}
              <Link href="/practice" className="font-semibold text-primary hover:text-primary-700">
                Practise what you learned
              </Link>{" "}
              or{" "}
              <Link href={`/learning/${gridSlug}`} className="font-semibold text-primary hover:text-primary-700">
                review the course
              </Link>
              .
            </p>
          )}
        </div>
      )}
      {celebration}
    </section>
  );
}

export default LessonComplete;
