"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CodingProblemBody } from "@/app/coding-problems/[problemSlug]/CodingProblemBody";
import { PRACTICE_CRUMBS, DIFFICULTY_PILL_CLASS } from "@/lib/practice.types";
import type { PracticeProblemDetail } from "@/lib/practice.types";

type Phase = "checking" | "locked" | "unlocked";

/**
 * The server renders a premium practice problem `locked` (anon client), so the
 * body / examples / editorial are never in the initial HTML. This island
 * re-calls `practice_problem_detail` with the visitor's real session: a premium
 * member (or admin) then gets `locked: false` and the full workspace renders
 * client-side. Everyone else keeps the upgrade CTA. Mirrors
 * `CodingProblemPremiumGate` on the Learning topic-practice route.
 */
export function PracticeProblemPremiumGate({
  problem,
  categoryName,
  slug,
  loginNext,
}: {
  problem: PracticeProblemDetail["problem"];
  categoryName: string;
  slug: string;
  loginNext: string;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [detail, setDetail] = useState<PracticeProblemDetail | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setPhase("locked");
        return;
      }
      const { data, error } = await supabase.rpc("practice_problem_detail", {
        p_slug: slug,
        p_platform: "website",
      });
      if (!active) return;
      const payload = data as PracticeProblemDetail | null;
      if (error || !payload || payload.locked) {
        setPhase("locked");
        return;
      }
      setDetail({
        ...payload,
        topic: {
          grid_slug: "",
          topic_slug: "",
          title: payload.category?.name ?? categoryName,
        },
      });
      setPhase("unlocked");
    })();
    return () => {
      active = false;
    };
  }, [slug, categoryName]);

  if (phase === "unlocked" && detail) {
    return (
      <CodingProblemBody
        detail={detail}
        nav={PRACTICE_CRUMBS}
        judgeEndpoint="/api/practice/judge"
        submitEndpoint="/api/practice/submit"
        submissionsHref="/practice/submissions"
      />
    );
  }

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-faint">
        <Link href="/practice" className="hover:text-ink">
          Practice
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/practice/problems" className="hover:text-ink">
          Coding Problems
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-faint">{problem.title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{problem.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              DIFFICULTY_PILL_CLASS[problem.difficulty] ?? "bg-surface text-ink-muted",
            )}
          >
            {problem.difficulty}
          </span>
          <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-ink-muted">{categoryName}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
          </span>
        </div>
      </header>

      {phase === "checking" ? (
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-line/70" />
          <div className="h-4 w-full animate-pulse rounded bg-line/70" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-line/50" />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-amber-500" aria-hidden />
          <h2 className="mt-3 text-lg font-bold text-ink">This is a premium problem</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            Upgrade to CampusEduX Premium to open this problem, its editor and its test cases.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button href="/premium">See Premium plans</Button>
            <Button href={`/login?next=${encodeURIComponent(loginNext)}`} variant="ghost">
              I already have Premium — sign in
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeProblemPremiumGate;
