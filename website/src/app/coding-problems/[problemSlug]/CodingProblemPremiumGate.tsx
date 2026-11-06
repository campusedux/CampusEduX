"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { Breadcrumb, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CodingProblemDetail } from "@/lib/learning.types";
import { CodingProblemBody } from "./CodingProblemBody";

type Phase = "locked" | "unlocked";

const DIFF_CLASS: Record<string, string> = {
  Easy: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-amber-800 dark:text-amber-300",
  Hard: "bg-danger/10 text-danger",
};

/**
 * The publicly-visible locked state: title, difficulty, languages and a
 * concrete "premium problem" notice, with the Premium / sign-in CTAs. Never
 * touches `problem.description` / `examples` / etc — the server-side RPC
 * already nulls those out for a locked problem, so there is nothing gated to
 * accidentally render here. A plain (directive-less, hook-less) component so
 * it's unit-testable without mounting `CodingProblemPremiumGate`'s client
 * state, and so it can double as the true initial SSR/no-JS HTML instead of a
 * content-free skeleton.
 */
export function CodingProblemLockedNotice({
  problem,
  topic,
  loginNext,
}: {
  problem: CodingProblemDetail["problem"];
  topic: CodingProblemDetail["topic"];
  loginNext: string;
}) {
  const backToTopic = `/learning/${topic.grid_slug}/${topic.topic_slug}`;

  return (
    <div className="container-page py-8">
      <Breadcrumb className="mb-4" items={[{ label: "Learning", href: "/learning" }, { label: topic.title, href: backToTopic }, { label: problem.title }]} />

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
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 font-medium text-amber-800 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
          </span>
        </div>
      </header>

      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-amber-500" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-ink">This is a premium problem</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          Unlock this problem with CampusEduX Premium to access its full statement, examples and code editor.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button href="/premium">See Premium plans</Button>
          <Button href={`/login?next=${encodeURIComponent(loginNext)}`} variant="ghost">
            I already have Premium — sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Server renders a premium Coding Problem `locked` (anon client), so the body /
 * examples / editorial are never in the initial HTML — but the initial HTML
 * still needs to be the real `CodingProblemLockedNotice`, not a content-free
 * skeleton, so it doubles as accurate SEO content. This island re-calls
 * `coding_problem_detail` with the visitor's real session: a premium member
 * (or admin) then gets `locked: false` and the full workspace swaps in
 * client-side (`CodingProblemBody` owns its own breadcrumb + header). Everyone
 * else stays on the notice above — never assume premium on the initial render.
 * Mirrors `PremiumTopicContent` on the Learning topic page.
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
  const [phase, setPhase] = useState<Phase>("locked");
  const [detail, setDetail] = useState<CodingProblemDetail | null>(null);
  // Anonymous visitors (the vast majority, and every crawler) can never
  // unlock, so the Supabase browser SDK (~67 kB gz) is only imported once the
  // shared `/api/session` check reports a signed-in user — it stays out of
  // this route's first-load JS entirely.
  const { loading: sessionLoading, profile } = useSessionProfile();
  const userId = profile?.id ?? null;

  useEffect(() => {
    let active = true;
    // Reset for the new slug in case this instance is reused across a
    // client-side navigation between two locked problems — never show a
    // previous problem's unlocked body under a new URL while re-checking.
    setPhase("locked");
    setDetail(null);
    if (sessionLoading || !userId) return;
    (async () => {
      const { createBrowserSupabase } = await import("@/lib/supabase/browser");
      if (!active) return;
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.rpc("coding_problem_detail", {
        p_slug: slug,
        p_platform: "website",
      });
      if (!active) return;
      const payload = data as CodingProblemDetail | null;
      if (error || !payload || payload.locked) return;
      setDetail(payload);
      setPhase("unlocked");
    })().catch(() => {
      /* SDK chunk / network failure — stay on the locked notice */
    });
    return () => {
      active = false;
    };
  }, [slug, sessionLoading, userId]);

  if (phase === "unlocked" && detail) {
    return (
      <CodingProblemBody
        detail={detail}
        submitEndpoint="/api/coding-problems/submit"
        submissionsHref="/practice/submissions"
      />
    );
  }

  return <CodingProblemLockedNotice problem={problem} topic={topic} loginNext={loginNext} />;
}

export default CodingProblemPremiumGate;
