"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/Toast";
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
  const latestDraft = useRef(draft);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const [loadError, setLoadError] = useState<Error | null>(null);

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
      const { data, error } = await supabase
        .from("custom_project_drafts")
        .select("payload")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) throw new Error(error.message);
      if (data?.payload) {
        latestDraft.current = normalizeDraft(data.payload);
        setDraft(latestDraft.current);
      }
      setLoaded(true);
    })().catch((err) => {
      if (!cancelled) setLoadError(err instanceof Error ? err : new Error("Something went wrong. Please try again."));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    (payload: BuilderDraft, uid: string) => {
      const write = writes.current.catch(() => {}).then(async () => {
        setSaving(true);
        try {
          const { error } = await createBrowserSupabase().from("custom_project_drafts")
            .upsert({ user_id: uid, payload }, { onConflict: "user_id" });
          if (error) throw new Error(error.message);
        } finally {
          setSaving(false);
        }
      });
      writes.current = write;
      return write;
    },
    [],
  );

  // debounced autosave
  useEffect(() => {
    if (!loaded || !userId || !dirtyRef.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      persist(latestDraft.current, userId).catch((err) => {
        toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" });
      });
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [draft, loaded, userId, persist]);

  const patch = useCallback((p: Partial<BuilderDraft>) => {
    dirtyRef.current = true;
    latestDraft.current = { ...latestDraft.current, ...p };
    setDraft(latestDraft.current);
  }, []);

  const update = useCallback((fn: (d: BuilderDraft) => BuilderDraft) => {
    dirtyRef.current = true;
    latestDraft.current = fn(latestDraft.current);
    setDraft(latestDraft.current);
  }, []);

  /** Flush any pending change immediately — call before navigating to the next step. */
  const saveNow = useCallback(async () => {
    if (!userId) return;
    if (timer.current) clearTimeout(timer.current);
    await persist(latestDraft.current, userId);
  }, [userId, persist]);

  const clearDraft = useCallback(async () => {
    if (!userId) return;
    if (timer.current) clearTimeout(timer.current);
    await writes.current.catch(() => {});
    const { error } = await createBrowserSupabase().from("custom_project_drafts").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    dirtyRef.current = false;
    latestDraft.current = emptyDraft();
    setDraft(latestDraft.current);
  }, [userId]);

  if (loadError) throw loadError;

  return { draft, patch, update, saveNow, clearDraft, loaded, userId, saving };
}
