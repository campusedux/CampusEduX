"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { useLearningProgress } from "@/lib/learningProgress";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface ContinueCourse {
  slug: string;
  name: string;
  topic_count: number;
}

/**
 * Learning hub "Continue learning" — signed-in students only, courses they've
 * started on this device (device-only progress), most recent first. Links to
 * the last lesson opened; the lesson route falls back to the course page if
 * that lesson has since been renamed or removed. Renders nothing otherwise.
 */
export function ContinueLearningRow({ courses }: { courses: ContinueCourse[] }) {
  const { loading, profile } = useSessionProfile();
  const progress = useLearningProgress();
  if (loading || !profile || !progress.ready) return null;

  const started = courses
    .map((c) => ({ c, p: progress.courseProgress(c.slug, c.topic_count) }))
    .filter(({ p }) => p.started)
    .sort((a, b) => (b.p.lastVisited?.at ?? "").localeCompare(a.p.lastVisited?.at ?? ""))
    .slice(0, 3);
  if (started.length === 0) return null;

  return (
    <section className="mt-6 sm:mt-8" aria-labelledby="continue-title">
      <h2 id="continue-title" className="h-section">
        Continue learning
      </h2>
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {started.map(({ c, p }) => {
          const href = p.lastVisited ? `/learning/${c.slug}/${p.lastVisited.topicSlug}` : `/learning/${c.slug}`;
          return (
            <Link key={c.slug} href={href} className="card card-hover group flex min-w-0 flex-col border-primary/20 p-4 [overflow-wrap:anywhere] sm:p-5">
              <p className="text-xs font-medium leading-5 text-ink-muted">{c.name}</p>
              <p className="mt-1 line-clamp-2 font-display text-base font-bold leading-6 text-ink group-hover:text-primary">
                {p.lastVisited?.topicTitle ?? "Pick up where you left off"}
              </p>
              <div className="mt-auto pt-3">
                <p className="mb-2 text-xs tabular-nums text-ink-muted">
                  {p.completed} of {p.total} lessons · {p.percent}%
                </p>
                <ProgressBar value={p.completed} max={p.total || 1} label={`${c.name} progress`} size="sm" />
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <PlayCircle className="h-4 w-4" aria-hidden /> Resume
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ContinueLearningRow;
