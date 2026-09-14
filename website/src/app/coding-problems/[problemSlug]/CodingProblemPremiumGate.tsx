"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CodingProblemDetail } from "@/lib/learning.types";
import { CodingProblemBody } from "./CodingProblemBody";

type Phase = "checking" | "locked" | "unlocked";

const DIFF_CLASS: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-700",
};

/**
 * Server renders a premium Coding Problem `locked` (anon client), so the body /
 * examples / editorial are never in the initial HTML. This island re-calls
 * `coding_problem_detail` with the visitor's real session: a premium member (or
 * admin) then gets `locked: false` and the full workspace renders client-side
 * (`CodingProblemBody` owns its own breadcrumb + header). Everyone else keeps
 * the upgrade CTA below. Mirrors `PremiumTopicContent` on the Learning topic
 * page.
 */
export function CodingProblemPremiumGate({
  problem,
  topic,
  slug,
  loginNext,
}: {
  problem: CodingProblemDetail["problem"];
  topic: CodingProblemDetail["topic"];
  slug: string;
  loginNext: string;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [detail, setDetail] = useState<CodingProblemDetail | null>(null);

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
      const { data, error } = await supabase.rpc("coding_problem_detail", {
        p_slug: slug,
        p_platform: "website",
      });
      if (!active) return;
      const payload = data as CodingProblemDetail | null;
      if (error || !payload || payload.locked) {
        setPhase("locked");
        return;
      }
      setDetail(payload);
      setPhase("unlocked");
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (phase === "unlocked" && detail) {
    return (
      <CodingProblemBody
        detail={detail}
        submitEndpoint="/api/coding-problems/submit"
        submissionsHref="/practice/submissions"
      />
    );
  }

  const backToTopic = `/learning/${topic.grid_slug}/${topic.topic_slug}`;

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-faint">
        <Link href="/learning" className="hover:text-ink">
          Learning
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href={backToTopic} className="hover:text-ink">
          {topic.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-faint">Coding Problem</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{problem.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              DIFF_CLASS[problem.difficulty] ?? "bg-surface text-ink-muted",
            )}
          >
            {problem.difficulty}
          </span>
          {problem.supported_languages?.length ? (
            <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-ink-muted">
              {problem.supported_languages.join(" · ")}
            </span>
          ) : null}
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

export default CodingProblemPremiumGate;
