"use client";

import { useEffect, useState } from "react";
import { useSessionProfile } from "@/lib/useSessionProfile";

/**
 * The signed-in student's bookmarked Learning topic ids (existing
 * `learning_bookmarks` table, RLS: own rows — same `select topic_id` the
 * lesson Bookmark button already runs). The Supabase browser client is
 * imported lazily, only for signed-in visitors, so it never lands in a page's
 * first-load JS. In-flight requests are shared by callers for the same user.
 */
const pending = new Map<string, Promise<Set<string>>>();

function loadBookmarks(userId: string): Promise<Set<string>> {
  const existing = pending.get(userId);
  if (existing) return existing;
  const request = (async () => {
    try {
      const { createBrowserSupabase } = await import("@/lib/supabase/browser");
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== userId) return new Set<string>();
      const { data } = await supabase.from("learning_bookmarks").select("topic_id").eq("user_id", user.id);
      return new Set((data ?? []).map((r: { topic_id: string }) => r.topic_id));
    } catch {
      return new Set<string>();
    }
  })().finally(() => { pending.delete(userId); });
  pending.set(userId, request);
  return request;
}

export function useLearningBookmarks(): Set<string> {
  const { profile } = useSessionProfile();
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const userId = profile?.id;
  useEffect(() => {
    setIds(new Set());
    if (!userId) return;
    let active = true;
    loadBookmarks(userId).then((s) => active && setIds(s));
    return () => {
      active = false;
    };
  }, [userId]);
  return ids;
}
