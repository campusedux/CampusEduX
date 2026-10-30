"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { Button } from "@/components/ui";

type Phase = "loading" | "anon" | "ready";

/** Toggle a `learning_bookmarks` row for the signed-in student (RLS: own rows).
 *  Independent of the prep_notes bookmark system — it targets the new tree.
 *
 *  Performance: signed-out visitors (and crawlers) are resolved from the
 *  shared `/api/session` check and never download the Supabase browser SDK;
 *  it is imported lazily (same pattern as `useLearningBookmarks`) only for a
 *  signed-in student, so it stays out of every lesson page's first-load JS. */
export function LearningBookmarkButton({ topicId, slugPath }: { topicId: string; slugPath: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [bookmarked, setBookmarked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading: sessionLoading, profile } = useSessionProfile();
  const userId = profile?.id ?? null;

  const load = useCallback(async () => {
    const { createBrowserSupabase } = await import("@/lib/supabase/browser");
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhase("anon");
      return;
    }
    const { data } = await supabase
      .from("learning_bookmarks")
      .select("topic_id")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .maybeSingle();
    setBookmarked(!!data);
    setPhase("ready");
  }, [topicId]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!userId) {
      setPhase("anon");
      return;
    }
    load().catch(() => {
      /* SDK chunk / network failure — keep the placeholder (unchanged behaviour) */
    });
  }, [sessionLoading, userId, load]);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      const { createBrowserSupabase } = await import("@/lib/supabase/browser");
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhase("anon");
        setPending(false);
        return;
      }
      const next = !bookmarked;
      const res = next
        ? await supabase
            .from("learning_bookmarks")
            .upsert({ user_id: user.id, topic_id: topicId }, { onConflict: "user_id,topic_id" })
        : await supabase.from("learning_bookmarks").delete().eq("user_id", user.id).eq("topic_id", topicId);
      setPending(false);
      if (res.error) {
        setError("Couldn't update the bookmark. Try again.");
        return;
      }
      setBookmarked(next);
    } catch {
      setError("Couldn't update the bookmark. Try again.");
    } finally {
      setPending(false);
    }
  }

  // Same box as the button that replaces it (`max-sm:h-11` below, and roughly
  // the signed-out "Sign in to bookmark" width) so the header row above the
  // lesson body doesn't grow and shift the article when the state resolves.
  if (phase === "loading") return <div className="h-11 w-[11.5rem] animate-pulse rounded-xl bg-line/70 sm:h-9" />;
  if (phase === "anon") {
    return (
      <Button href={`/login?next=${encodeURIComponent(slugPath)}`} variant="ghost" size="sm" leftIcon={Bookmark} className="max-sm:h-11">
        Sign in to bookmark
      </Button>
    );
  }

  return (
    <div>
      <Button
        variant={bookmarked ? "secondary" : "ghost"}
        size="sm"
        className="max-sm:h-11"
        onClick={toggle}
        loading={pending}
        leftIcon={bookmarked ? BookmarkCheck : Bookmark}
      >
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </Button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export default LearningBookmarkButton;
