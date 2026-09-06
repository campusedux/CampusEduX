"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui";
import type { CodingProblemDetail } from "@/lib/learning.types";
import { CodingProblemBody } from "./CodingProblemBody";

type Phase = "checking" | "locked" | "unlocked";

/**
 * Server renders a premium Coding Problem `locked` (anon client), so the body /
 * examples / editorial are never in the initial HTML. This island re-calls
 * `coding_problem_detail` with the visitor's real session: a premium member (or
 * admin) then gets `locked: false` and the full problem + workspace render
 * client-side. Everyone else keeps the upgrade CTA. Mirrors
 * `PremiumTopicContent` on the Learning topic page.
 */
export function CodingProblemPremiumGate({ slug, loginNext }: { slug: string; loginNext: string }) {
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

  if (phase === "checking") {
    return (
      <div className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-line/70" />
        <div className="h-4 w-full animate-pulse rounded bg-line/70" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-line/50" />
      </div>
    );
  }

  if (phase === "unlocked" && detail) {
    return <CodingProblemBody detail={detail} />;
  }

  return (
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
  );
}

export default CodingProblemPremiumGate;
