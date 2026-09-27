"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Lock } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { cn } from "@/lib/cn";
import { Button, EmptyState } from "@/components/ui";
import type { LearningContentBlock } from "@/lib/learning.types";

type Phase = "checking" | "locked" | "unlocked";

// The lesson renderer is only needed once a premium member's content arrives
// (after a client RPC), so it loads lazily instead of on every lesson page.
const LessonBlock = dynamic(() => import("@/components/learning/LessonBlock").then((m) => m.LessonBlock));

/**
 * The server renders this page with the anon Supabase client (so the HTML is
 * cacheable and crawler-safe), which means a premium topic always comes back
 * `locked` server-side — the body is never in the initial HTML. This island
 * re-runs `learning_topic_content` from the browser with the visitor's real
 * session: an authorised premium member (or admin) then gets `locked: false`
 * and the content is rendered client-side. Everyone else keeps the upgrade CTA.
 *
 * Performance: signed-out visitors (and crawlers) are resolved from the shared
 * `/api/session` check and never download the Supabase browser SDK — it is
 * imported lazily, only for a signed-in visitor. While checking, the upgrade
 * card's own box is shown (content hidden) so the most common outcome —
 * "locked" — fills it in place with no layout shift below.
 */
export function PremiumTopicContent({
  gridSlug,
  topicSlug,
  loginNext,
  unlockedFooter,
}: {
  gridSlug: string;
  topicSlug: string;
  loginNext: string;
  /** Rendered only once the content is unlocked (e.g. the "Mark as complete" card). */
  unlockedFooter?: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [blocks, setBlocks] = useState<LearningContentBlock[]>([]);
  const { loading: sessionLoading, profile } = useSessionProfile();
  const userId = profile?.id ?? null;

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setPhase("locked");
      return;
    }
    let active = true;
    (async () => {
      const { createBrowserSupabase } = await import("@/lib/supabase/browser");
      if (!active) return;
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setPhase("locked");
        return;
      }
      const { data, error } = await supabase.rpc("learning_topic_content", {
        p_grid_slug: gridSlug,
        p_topic_slug: topicSlug,
        p_platform: "website",
      });
      if (!active) return;
      const payload = data as { locked?: boolean; contents?: LearningContentBlock[] } | null;
      if (error || !payload || payload.locked) {
        setPhase("locked");
        return;
      }
      setBlocks(payload.contents ?? []);
      setPhase("unlocked");
    })().catch(() => {
      /* SDK chunk / network failure — keep the current state (unchanged behaviour) */
    });
    return () => {
      active = false;
    };
  }, [gridSlug, topicSlug, sessionLoading, userId]);

  if (phase === "unlocked") {
    return (
      <>
      <div className="max-w-none">
        {blocks.length === 0 ? (
          <EmptyState title="No content yet" subtitle="This topic's content is on its way — check back soon." />
        ) : (
          blocks.map((block) => (
            <section key={block.id} className="mb-8">
              <LessonBlock block={block} />
            </section>
          ))
        )}
      </div>
      {unlockedFooter}
      </>
    );
  }

  const checking = phase === "checking";
  return (
    <div
      aria-busy={checking || undefined}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-warning/30 bg-gradient-to-br from-warning/10 via-card to-accent-pink/[0.06] px-6 py-10 text-center",
        checking && "animate-pulse",
      )}
    >
      <div className={checking ? "invisible" : undefined} aria-hidden={checking || undefined}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15">
          <Lock className="h-7 w-7 text-amber-600 dark:text-amber-300" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">This is a premium lesson</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          Upgrade to CampusEduX Premium to read this topic and everything else marked premium.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/premium">See Premium plans</Button>
          <Button href={`/login?next=${encodeURIComponent(loginNext)}`} variant="ghost">
            I already have Premium — sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PremiumTopicContent;
