"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui";

type Phase = "loading" | "anon" | "ready";

/** Toggle a `learning_bookmarks` row for the signed-in student (RLS: own rows).
 *  Independent of the prep_notes bookmark system — it targets the new tree. */
export function LearningBookmarkButton({ topicId, slugPath }: { topicId: string; slugPath: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [bookmarked, setBookmarked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  async function toggle() {
    setPending(true);
    setError(null);
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
  }

  if (phase === "loading") return <div className="h-9 w-32 animate-pulse rounded-xl bg-line/70" />;
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
