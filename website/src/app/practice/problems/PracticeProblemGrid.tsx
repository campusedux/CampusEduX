"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleDashed, Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";
import { DIFFICULTY_PILL_CLASS, PRACTICE_LANGUAGE_LABEL } from "@/lib/practice.types";
import type { PracticeProblemCard, SolvedFilter } from "@/lib/practice.types";

type SolvedState = "loading" | "anon" | "ready";

/**
 * The problem list. Server-rendered rows hydrate here; on mount we look up the
 * viewer's `user_dsa_progress` for the visible problems (owner-only RLS) and (a)
 * badge solved rows, (b) apply the Solved / Unsolved filter for this page. When
 * signed out, the Solved / Unsolved filter is a no-op and a hint is shown.
 */
export function PracticeProblemGrid({
  items,
  statusFilter,
}: {
  items: PracticeProblemCard[];
  statusFilter?: SolvedFilter;
}) {
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [state, setState] = useState<SolvedState>("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState("anon");
        return;
      }
      const ids = items.map((p) => p.id);
      if (ids.length === 0) {
        setState("ready");
        return;
      }
      const { data } = await supabase
        .from("user_dsa_progress")
        .select("problem_id")
        .eq("status", "solved")
        .in("problem_id", ids);
      if (!active) return;
      setSolved(new Set((data ?? []).map((r) => r.problem_id as string)));
      setState("ready");
    })();
    return () => {
      active = false;
    };
  }, [items]);

  const visible = items.filter((p) => {
    if (!statusFilter || state !== "ready") return true;
    const isSolved = solved.has(p.id);
    return statusFilter === "solved" ? isSolved : !isSolved;
  });

  return (
    <div>
      {statusFilter && state === "anon" ? (
        <p className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
          <Link href={`/login?next=${encodeURIComponent("/practice/problems")}`} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to filter by Solved / Unsolved.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface px-6 py-12 text-center text-sm text-ink-muted">
          {statusFilter === "solved"
            ? "You haven't solved any problems on this page yet."
            : "Every problem on this page is solved. Nice."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const isSolved = state === "ready" && solved.has(p.id);
            return (
              <li key={p.slug}>
                <Link
                  href={`/practice/problems/${p.slug}`}
                  className="card card-hover flex h-full flex-col gap-2 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-faint">
                      {isSolved ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                          <span className="text-success">Solved</span>
                        </>
                      ) : state === "ready" ? (
                        <>
                          <CircleDashed className="h-3.5 w-3.5" aria-hidden />
                          Unsolved
                        </>
                      ) : (
                        <span className="h-3.5 w-16 animate-pulse rounded bg-line/60" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                        DIFFICULTY_PILL_CLASS[p.difficulty] ?? "bg-surface text-ink-muted",
                      )}
                    >
                      {p.difficulty}
                    </span>
                  </div>

                  <h3 className="font-semibold leading-snug text-ink">{p.title}</h3>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[0.7rem] text-ink-faint">
                    <span className="rounded bg-surface px-1.5 py-0.5 font-medium">{p.category_name}</span>
                    {(p.supported_languages ?? []).slice(0, 5).map((l) => (
                      <span key={l} className="rounded bg-surface px-1.5 py-0.5">
                        {PRACTICE_LANGUAGE_LABEL[l] ?? l}
                      </span>
                    ))}
                    {p.is_premium ? (
                      <span className="inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 py-0.5 font-semibold text-amber-800 dark:text-amber-300">
                        <Lock className="h-3 w-3" aria-hidden /> Premium
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PracticeProblemGrid;
