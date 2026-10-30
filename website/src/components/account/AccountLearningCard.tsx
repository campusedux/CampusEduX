"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, GraduationCap, PlayCircle } from "lucide-react";
import { useLearningProgress } from "@/lib/learningProgress";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface AccountCourse {
  slug: string;
  name: string;
  topic_count: number;
}

/**
 * Account overview "Learning" card. DEVICE-ONLY: reads useLearningProgress
 * (localStorage on this browser), not the account — so it can differ between
 * devices until progress has a backend (see src/lib/learningProgress/store.ts).
 */
export function AccountLearningCard({ courses }: { courses: AccountCourse[] }) {
  const progress = useLearningProgress();

  if (!progress.ready) {
    return <div className="card h-full min-h-[14rem] animate-pulse bg-surface/60" aria-hidden />;
  }

  const started = courses
    .map((c) => ({ c, p: progress.courseProgress(c.slug, c.topic_count) }))
    .filter(({ p }) => p.started)
    .sort((a, b) => (b.p.lastVisited?.at ?? "").localeCompare(a.p.lastVisited?.at ?? ""))
    .slice(0, 3);
  const last = progress.lastVisited;

  return (
    <section className="card flex h-full flex-col p-5 sm:p-6" aria-labelledby="account-learning-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="account-learning-title" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <GraduationCap className="h-5 w-5 text-primary" aria-hidden /> Learning
        </h2>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {progress.streak.current > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-amber-800 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5" aria-hidden /> {progress.streak.current}-day streak
            </span>
          )}
          <span className="rounded-full bg-surface px-2.5 py-1 text-ink-muted">
            Today {progress.today.completedToday}/{progress.today.goal}
          </span>
        </div>
      </div>

      {started.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center py-6">
          <p className="text-sm text-ink-muted">You haven&apos;t started a course on this device yet.</p>
          <Link href="/learning" className="btn-secondary mt-4 min-h-11 text-sm">
            <BookOpen className="h-4 w-4" aria-hidden /> Browse courses
          </Link>
        </div>
      ) : (
        <>
          {last && (
            <Link
              href={`/learning/${last.gridSlug}/${last.topicSlug}`}
              className="group mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-accent-violet p-4 text-white"
            >
              <PlayCircle className="h-8 w-8 flex-shrink-0 opacity-90" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-white/75">Continue · {last.gridName}</span>
                <span className="block truncate font-semibold">{last.topicTitle}</span>
              </span>
              <ArrowRight className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
            </Link>
          )}
          <ul className="mt-4 space-y-3.5">
            {started.map(({ c, p }) => (
              <li key={c.slug}>
                <Link href={`/learning/${c.slug}`} className="group block min-h-11">
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold text-ink group-hover:text-primary">{c.name}</span>
                    <span className="flex-shrink-0 text-xs text-ink-faint">
                      {p.completed}/{p.total} · {p.percent}%
                    </span>
                  </span>
                  <ProgressBar className="mt-1.5" value={p.completed} max={p.total || 1} label={`${c.name} progress`} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-4 text-[11px] text-ink-faint">Progress is saved on this device.</p>
    </section>
  );
}

export default AccountLearningCard;
