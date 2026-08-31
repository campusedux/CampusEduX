"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui";

type Phase = "loading" | "anon" | "ready";

/** Toggle a `prep_note_bookmarks` row for the signed-in student (RLS: own rows). */
export default function BookmarkButton({ noteId }: { noteId: string }) {
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
      .from("prep_note_bookmarks")
      .select("note_id")
      .eq("user_id", user.id)
      .eq("note_id", noteId)
      .maybeSingle();
    setBookmarked(!!data);
    setPhase("ready");
  }, [noteId]);

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
      ? await supabase.from("prep_note_bookmarks").upsert({ user_id: user.id, note_id: noteId }, { onConflict: "user_id,note_id" })
      : await supabase.from("prep_note_bookmarks").delete().eq("user_id", user.id).eq("note_id", noteId);
    setPending(false);
    if (res.error) {
      setError("Couldn't update the bookmark. Try again.");
      return;
    }
    setBookmarked(next);
  }

  if (phase === "loading") return <div className="h-11 w-40 animate-pulse rounded-xl bg-line/70" />;
  if (phase === "anon") {
    return (
      <Button href={`/login?next=${encodeURIComponent(`/placement/notes/${noteId}`)}`} variant="ghost" leftIcon={Bookmark}>
        Sign in to bookmark
      </Button>
    );
  }

  return (
    <div>
      <Button
        variant={bookmarked ? "secondary" : "ghost"}
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
