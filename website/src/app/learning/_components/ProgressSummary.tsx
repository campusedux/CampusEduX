"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface TopicProgress {
  topic_id: string;
  topic_slug: string;
  topic_title: string;
  section_slug: string;
  section_name: string;
  best_score_pct: number | null;
  mcq_attempts: number;
  coding_total: number;
  coding_solved: number;
  coding_attempted: number;
  is_weak: boolean;
}

/**
 * Signed-in-only "Your Progress" card for a Learning grid — best MCQ score
 * and coding solved/attempted per topic, aggregated purely from existing
 * `test_attempts` / `user_dsa_progress` via `learning_progress_summary()`
 * (0091/063). Renders nothing for a signed-out visitor or a grid with no
 * recorded activity yet — every other grid's page is unaffected either way.
 *
 * Client island: the grid page is public ISR and must not read cookies() on
 * the server (that made every hit a dynamic render). The per-user data comes
 * from `GET /api/learning/progress` (private, no-store), fetched only when a
 * Supabase auth cookie is present.
 */
export function ProgressSummary({ gridSlug }: { gridSlug: string }) {
  const [topics, setTopics] = useState<TopicProgress[] | null>(null);

  useEffect(() => {
    if (!/(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    let cancelled = false;
    fetch(`/api/learning/progress?grid=${encodeURIComponent(gridSlug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j && Array.isArray(j.topics)) setTopics(j.topics as TopicProgress[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [gridSlug]);

  if (!topics) return null;
  const attempted = topics.filter((t) => t.mcq_attempts > 0 || t.coding_attempted > 0 || t.coding_solved > 0);
  if (attempted.length === 0) return null;

  const weak = topics.filter((t) => t.is_weak);
  const solvedProblems = topics.reduce((n, t) => n + t.coding_solved, 0);
  const totalProblems = topics.reduce((n, t) => n + t.coding_total, 0);

  return (
    <div className="mt-4 rounded-2xl border border-line bg-card p-5 shadow-card">
      <h2 className="text-sm font-semibold text-ink">Your progress</h2>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
        <span>
          {attempted.length} / {topics.length} topics attempted
        </span>
        {totalProblems > 0 ? (
          <span>
            {solvedProblems} / {totalProblems} coding problems solved
          </span>
        ) : null}
      </div>

      {weak.length > 0 ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Weak topics — worth another look
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {weak.map((t) => (
              <li key={t.topic_id}>
                <Link
                  href={`/learning/${gridSlug}/${t.topic_slug}`}
                  className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-warning/20"
                >
                  {t.topic_title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> No weak topics right now — nice work.
        </p>
      )}
    </div>
  );
}

export default ProgressSummary;
