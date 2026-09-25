"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, Flame, MapPin, PlayCircle, Target } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { useLearningProgress } from "@/lib/learningProgress";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { JobCardData } from "@/components/JobCard";

export interface PersonalCourse {
  slug: string;
  name: string;
  topic_count: number;
  is_featured: boolean;
  is_premium: boolean;
}

const WEEKDAY = new Intl.DateTimeFormat("en-IN", { weekday: "narrow" });

/**
 * Signed-in students only: "Welcome back", Continue learning, streak + daily
 * goal, latest jobs, and courses they haven't started. Home stays statically
 * rendered (ISR) — this island decides client-side and renders NOTHING for
 * signed-out visitors (or until the session + stored progress are known), so
 * the marketing flow is untouched for them.
 *
 * Progress is device-only (see src/lib/learningProgress/store.ts).
 */
export function HomePersonal({ courses, jobs }: { courses: PersonalCourse[]; jobs: JobCardData[] }) {
  const { loading, profile } = useSessionProfile();
  const progress = useLearningProgress();
  if (loading || !profile || !progress.ready) return null;

  const firstName = profile.fullName?.trim().split(/\s+/)[0] || "there";
  const last = progress.lastVisited;
  const lastCourse = last ? courses.find((c) => c.slug === last.gridSlug) : undefined;
  const lastProgress = last ? progress.courseProgress(last.gridSlug, lastCourse?.topic_count ?? 0) : null;

  const recommended = courses
    .filter((c) => !progress.courseProgress(c.slug, c.topic_count).started)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .slice(0, 3);
  const starter = recommended[0] ?? courses[0];

  const { streak, today, week } = progress;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className="container-page pt-6 sm:pt-8" aria-labelledby="home-personal-title">
      <div className="animate-fade-in-up rounded-3xl border border-line bg-card p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink-muted">{greeting},</p>
            <h2 id="home-personal-title" className="h-section mt-0.5">
              Welcome back, {firstName}
            </h2>
          </div>
          {streak.current > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <Flame className="h-4 w-4" aria-hidden />
              {streak.current}-day streak
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Continue learning */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent-violet p-5 text-white">
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            {last ? (
              <div className="relative flex h-full flex-col">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                  <PlayCircle className="h-4 w-4" aria-hidden /> Continue learning
                </p>
                <p className="mt-3 text-sm text-white/80">{last.gridName}</p>
                <p className="font-display text-xl font-bold leading-snug">{last.topicTitle}</p>
                {lastProgress && lastProgress.total > 0 && (
                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lastProgress.percent}>
                      <div className="h-full origin-left animate-progress-fill rounded-full bg-white" style={{ width: `${lastProgress.percent}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-white/80">
                      {lastProgress.completed} of {lastProgress.total} lessons done
                    </p>
                  </div>
                )}
                <div className="mt-auto pt-5">
                  <Link
                    href={`/learning/${last.gridSlug}/${last.topicSlug}`}
                    className="theme-light inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary-700 shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
                  >
                    Resume lesson <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative flex h-full flex-col">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
                  <BookOpen className="h-4 w-4" aria-hidden /> Start learning
                </p>
                <p className="mt-3 font-display text-xl font-bold leading-snug">
                  {starter ? `Begin with ${starter.name}` : "Pick your first course"}
                </p>
                <p className="mt-1 text-sm text-white/80">Your progress on this device shows up here.</p>
                <div className="mt-auto pt-5">
                  <Link
                    href={starter ? `/learning/${starter.slug}` : "/learning"}
                    className="theme-light inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-primary-700 shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
                  >
                    {starter ? "Start course" : "Browse courses"} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Streak + daily goal */}
          <div className="rounded-2xl border border-line bg-surface/60 p-5">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
              <Target className="h-4 w-4" aria-hidden /> This week
            </p>
            <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Learning activity, last 7 days">
              {week.map((d, i) => {
                const date = new Date(`${d.day}T12:00:00`);
                const isToday = i === week.length - 1;
                return (
                  <li key={d.day} className="flex flex-col items-center gap-1.5">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs transition",
                        d.active ? "border-transparent bg-gradient-to-br from-warning to-accent-pink text-white" : "border-line bg-card text-ink-faint",
                        isToday && !d.active && "border-primary/50",
                      )}
                      aria-label={`${d.day}: ${d.active ? "active" : "no activity"}`}
                    >
                      {d.active ? <Flame className="h-3.5 w-3.5" aria-hidden /> : null}
                    </span>
                    <span className={cn("text-[11px] font-semibold", isToday ? "text-primary" : "text-ink-faint")} aria-hidden>
                      {WEEKDAY.format(date)}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5">
              <ProgressBar
                value={today.completedToday}
                max={today.goal}
                tone={today.met ? "success" : "primary"}
                label="Today's goal"
                size="sm"
              />
              <p className="mt-2 text-sm text-ink-muted">
                {today.met ? (
                  <span className="font-semibold text-success">Daily goal done — nice work!</span>
                ) : (
                  <>
                    <span className="font-semibold text-ink">
                      {today.completedToday}/{today.goal}
                    </span>{" "}
                    lesson{today.goal === 1 ? "" : "s"} completed today
                  </>
                )}
              </p>
              {streak.current === 0 && (
                <p className="mt-1 text-xs text-ink-faint">Open a lesson today to start a streak.</p>
              )}
            </div>
          </div>

          {/* Latest jobs */}
          <div className="rounded-2xl border border-line bg-surface/60 p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                <Briefcase className="h-4 w-4" aria-hidden /> Latest jobs
              </p>
              <Link href="/jobs" className="text-xs font-semibold text-primary hover:text-primary-700">
                View all
              </Link>
            </div>
            {jobs.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {jobs.slice(0, 3).map((j) => (
                  <li key={j.id}>
                    <Link href={`/jobs/${j.id}`} className="group block py-2.5">
                      <span className="block truncate text-sm font-semibold text-ink group-hover:text-primary">{j.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                        <span className="truncate">{j.company_name ?? "Company"}</span>
                        {j.location && (
                          <span className="inline-flex items-center gap-0.5 truncate">
                            <MapPin className="h-3 w-3" aria-hidden />
                            {j.location}
                          </span>
                        )}
                        {j.posted_at && <span className="ml-auto whitespace-nowrap text-ink-faint">{timeAgo(j.posted_at)}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-ink-muted">No new openings right now — new roles are added regularly.</p>
                <Button href="/jobs" variant="secondary" size="sm" className="mt-3">
                  Browse jobs
                </Button>
              </div>
            )}
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-ink">Recommended for you</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {recommended.map((c) => (
                <Link
                  key={c.slug}
                  href={`/learning/${c.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 transition hover:border-primary/30 hover:bg-surface"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <BookOpen className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink group-hover:text-primary">{c.name}</span>
                    <span className="block text-xs text-ink-faint">
                      {c.topic_count} lessons · {c.is_premium ? "Premium" : "Free"}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomePersonal;
