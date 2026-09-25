"use client";

import { useEffect, useState } from "react";
import { useSessionProfile } from "@/lib/useSessionProfile";

/**
 * The signed-in student's bookmarked Learning topic ids (existing
 * `learning_bookmarks` table, RLS: own rows — same `select topic_id` the
 * lesson Bookmark button already runs). The Supabase browser client is
 * imported lazily, only for signed-in visitors, so it never lands in a page's
 * first-load JS. One request per page load, shared by every caller.
 */
let pending: Promise<Set<string>> | null = null;

function loadBookmarks(): Promise<Set<string>> {
  if (!pending) {
    pending = (async () => {
      try {
        const { createBrowserSupabase } = await import("@/lib/supabase/browser");
        const supabase = createBrowserSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return new Set<string>();
        const { data } = await supabase.from("learning_bookmarks").select("topic_id").eq("user_id", user.id);
        return new Set((data ?? []).map((r: { topic_id: string }) => r.topic_id));
      } catch {
        return new Set<string>();
      }
    })();
  }
  return pending;
}

export function useLearningBookmarks(): Set<string> {
  const { profile } = useSessionProfile();
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!profile) return;
    let active = true;
    loadBookmarks().then((s) => active && setIds(s));
    return () => {
      active = false;
    };
  }, [profile]);
  return ids;
}
