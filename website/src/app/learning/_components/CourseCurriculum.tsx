"use client";

import { canonicalContentPath } from "@/lib/contentRedirects";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, ChevronDown, ListChecks, Lock, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLearningProgress } from "@/lib/learningProgress";
import { useLearningBookmarks } from "@/lib/useLearningBookmarks";
import type { CourseOutline, OutlineLesson } from "@/lib/courseOutline";
import { DBMS_SQL_SLUG } from "@/lib/databaseTutorial";

/**
 * Course curriculum: sections as native <details> (every lesson link is in the
 * server HTML for crawlers; only the current section starts open), per-section
 * progress, completed ticks, premium locks, bookmark markers, and an in-course
 * lesson filter. Progress is device-only (useLearningProgress).
 */
export function CourseCurriculum({
  outline,
  chapterTests,
}: {
  outline: CourseOutline;
  chapterTests: Record<string, { id: string; title: string }>;
}) {
  const progress = useLearningProgress();
  const bookmarks = useLearningBookmarks();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set(outline.sections[0] ? [outline.sections[0].id] : []));

  const { gridSlug } = outline;
  const databaseCourse = gridSlug === DBMS_SQL_SLUG;
  const topicLabel = databaseCourse ? "topic" : "lesson";
  const done = (slug: string) => progress.ready && progress.isComplete(gridSlug, slug);

  // After hydration, open the section the student is actually in instead of section 1.
  useEffect(() => {
    if (!progress.ready) return;
    const target =
      progress.state.courses[gridSlug]?.lastVisited?.topicSlug ?? progress.firstIncomplete(gridSlug, outline.order);
    const section = target ? outline.sections.find((s) => s.lessons.some((l) => l.slug === target)) : undefined;
    if (section) setOpen(new Set([section.id]));
    // Only on first ready — never fight the student's own toggling afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.ready]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return outline.sections
      .map((s) => ({ section: s, lessons: s.lessons.filter((l) => l.title.toLowerCase().includes(q)) }))
      .filter((g) => g.lessons.length > 0);
  }, [q, outline.sections]);
  const matchCount = matches?.reduce((n, g) => n + g.lessons.length, 0) ?? 0;

  const toggle = (id: string, isOpen: boolean) =>
    setOpen((prev) => {
      if (prev.has(id) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });

  const row = (l: OutlineLesson) => {
    const complete = done(l.slug);
    return (
      <li key={l.id}>
        <Link prefetch={false}
          href={canonicalContentPath(`/learning/${gridSlug}/${l.slug}`)}
          className="group flex min-h-11 min-w-0 items-start gap-2 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-surface"
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors",
              complete ? "border-transparent bg-success text-white" : "border-line bg-card text-ink-faint",
            )}
            aria-label={complete ? "Completed" : undefined}
          >
            {complete ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : databaseCourse ? null : l.number}
          </span>
          <span className={cn("min-w-0 flex-1 text-sm font-medium leading-6 group-hover:text-primary", complete ? "text-ink-muted" : "text-ink")}>
            {l.title}
          </span>
          {bookmarks.has(l.id) && <Bookmark className="mt-1 h-3.5 w-3.5 shrink-0 fill-primary text-primary" aria-label="Bookmarked" />}
          {l.isPremium && (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-amber-800 dark:text-amber-300">
              <Lock className="h-2.5 w-2.5" aria-hidden /> Premium
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <section aria-labelledby="curriculum-title" className="min-w-0 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id="curriculum-title" className="h-section">
            Course content
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {databaseCourse ? `${outline.total} topics` : <>{outline.sections.length} section{outline.sections.length === 1 ? "" : "s"} · {outline.total} lesson{outline.total === 1 ? "" : "s"}</>}
          </p>
        </div>
        {!q && outline.sections.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen(open.size === outline.sections.length ? new Set() : new Set(outline.sections.map((s) => s.id)))}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary hover:text-primary-700"
          >
            {open.size === outline.sections.length ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {outline.total > 8 && (
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${outline.total} ${topicLabel}s in this course…`}
            aria-label={`Search ${topicLabel}s in this course`}
            className="h-11 min-w-0 w-full rounded-lg border border-line bg-card pl-9 pr-12 text-base text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint hover:bg-surface hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}

      {matches ? (
        <div className="mt-4" aria-live="polite">
          <p className="text-sm text-ink-muted">
            {matchCount} {topicLabel}{matchCount === 1 ? "" : "s"} match “{query.trim()}”
          </p>
          {matches.map((g) => (
            <div key={g.section.id} className="mt-3 rounded-2xl border border-line bg-card p-2">
              <p className="px-2.5 pb-1.5 pt-2 text-xs font-semibold leading-5 text-ink-muted">{g.section.name}</p>
              <ol className="divide-y divide-line/60">{g.lessons.map(row)}</ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {outline.sections.map((s, si) => {
            const total = s.lessons.length;
            const completed = progress.ready ? s.lessons.filter((l) => done(l.slug)).length : 0;
            const pct = total ? Math.round((completed / total) * 100) : 0;
            const test = chapterTests[s.id];
            return (
              <details
                key={s.id}
                open={open.has(s.id)}
                onToggle={(e) => toggle(s.id, (e.currentTarget as HTMLDetailsElement).open)}
                className="group/sec overflow-hidden rounded-2xl border border-line bg-card"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 px-3 py-3 sm:px-4 [&::-webkit-details-marker]:hidden">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                      completed === total && total > 0 ? "bg-success/15 text-success" : "bg-primary-50 text-primary",
                    )}
                  >
                    {completed === total && total > 0 ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : databaseCourse ? <ListChecks className="h-4 w-4" aria-hidden /> : si + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-6 text-ink sm:text-base">{s.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                      <span>
                        {progress.ready && completed > 0 ? `${completed}/${total} done` : `${total} ${topicLabel}${total === 1 ? "" : "s"}`}
                      </span>
                      {progress.ready && completed > 0 && (
                        <span className="h-1 w-20 overflow-hidden rounded-full bg-line" aria-hidden>
                          <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open/sec:rotate-180 motion-reduce:transition-none"
                    aria-hidden
                  />
                </summary>
                <div className="border-t border-line px-1.5 py-1">
                  {total === 0 ? (
                    <p className="px-3 py-2 text-sm text-ink-faint">No lessons published yet.</p>
                  ) : (
                    <ol className="divide-y divide-line/60">{s.lessons.map(row)}</ol>
                  )}
                  {test && (
                    <Link prefetch={false}
                      href={`/mock-tests/${test.id}`}
                      className="mt-1 flex min-h-11 items-start gap-2 rounded-lg border-t border-line px-2.5 py-3 text-sm font-semibold leading-6 text-primary transition-colors hover:bg-surface"
                    >
                      <ListChecks className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">{databaseCourse ? `${s.name} review` : test.title}</span>
                    </Link>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CourseCurriculum;
