"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { type BuilderDraft, emptyDraft, normalizeDraft } from "@/lib/customProjects";

/**
 * Wizard draft state backed by `custom_project_drafts` (one row per user, RLS
 * = owner full CRUD — mobile-app migration 0033 §28). Loads the row on mount,
 * debounce-saves on every change so a refresh or a jump between steps keeps
 * progress. Matches customProjects.service.getDraft/saveDraft/deleteDraft.
 */
export function useDraft() {
  const [draft, setDraft] = useState<BuilderDraft>(emptyDraft());
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  // initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setLoaded(true);
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from("custom_project_drafts")
        .select("payload")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.payload) setDraft(normalizeDraft(data.payload));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (payload: BuilderDraft, uid: string) => {
      setSaving(true);
      const supabase = createBrowserSupabase();
      await supabase.from("custom_project_drafts").upsert({ user_id: uid, payload }, { onConflict: "user_id" });
      setSaving(false);
    },
    [],
  );

  // debounced autosave
  useEffect(() => {
    if (!loaded || !userId || !dirtyRef.current) return;
    const t = setTimeout(() => {
      persist(draft, userId);
    }, 700);
    return () => clearTimeout(t);
  }, [draft, loaded, userId, persist]);

  const patch = useCallback((p: Partial<BuilderDraft>) => {
    dirtyRef.current = true;
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const update = useCallback((fn: (d: BuilderDraft) => BuilderDraft) => {
    dirtyRef.current = true;
    setDraft((d) => fn(d));
  }, []);

  /** Flush any pending change immediately — call before navigating to the next step. */
  const saveNow = useCallback(async () => {
    if (!userId) return;
    await persist(draft, userId);
  }, [userId, draft, persist]);

  const clearDraft = useCallback(async () => {
    if (!userId) return;
    const supabase = createBrowserSupabase();
    await supabase.from("custom_project_drafts").delete().eq("user_id", userId);
    setDraft(emptyDraft());
    dirtyRef.current = false;
  }, [userId]);

  return { draft, patch, update, saveNow, clearDraft, loaded, userId, saving };
}
