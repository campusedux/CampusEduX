"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Markdown } from "@/components/learning/Markdown";
import { Button, EmptyState } from "@/components/ui";
import type { LearningContentBlock } from "@/lib/learning.types";

type Phase = "checking" | "locked" | "unlocked";

/**
 * The server renders this page with the anon Supabase client (so the HTML is
 * cacheable and crawler-safe), which means a premium topic always comes back
 * `locked` server-side — the body is never in the initial HTML. This island
 * re-runs `learning_topic_content` from the browser with the visitor's real
 * session: an authorised premium member (or admin) then gets `locked: false`
 * and the content is rendered client-side. Everyone else keeps the upgrade CTA.
 */
export function PremiumTopicContent({
  gridSlug,
  topicSlug,
  loginNext,
}: {
  gridSlug: string;
  topicSlug: string;
  loginNext: string;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [blocks, setBlocks] = useState<LearningContentBlock[]>([]);

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
    })();
    return () => {
      active = false;
    };
  }, [gridSlug, topicSlug]);

  if (phase === "checking") {
    return (
      <div className="space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-line/70" />
        <div className="h-4 w-full animate-pulse rounded bg-line/70" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-line/70" />
      </div>
    );
  }

  if (phase === "unlocked") {
    return (
      <div className="max-w-none">
        {blocks.length === 0 ? (
          <EmptyState title="No content yet" subtitle="This topic's content is on its way — check back soon." />
        ) : (
          blocks.map((block) => (
            <section key={block.id} className="mb-8">
              {block.heading ? <h2 className="mb-3 text-xl font-bold text-ink">{block.heading}</h2> : null}
              {block.content_format === "plain" ? (
                <p className="whitespace-pre-line leading-7 text-ink-muted">{block.body}</p>
              ) : (
                <Markdown source={block.body} />
              )}
            </section>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center">
      <Lock className="mx-auto h-8 w-8 text-amber-500" aria-hidden />
      <h2 className="mt-3 text-lg font-bold text-ink">This is a premium topic</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
        Upgrade to CampusEduX Premium to read this topic and everything else marked premium.
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

export default PremiumTopicContent;
