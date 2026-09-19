import { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/store/authStore";
import type { ReaderFontSize } from "@/theme/typography";
import { computeStreak, localDateKey, topicKey } from "./progressLogic";
import { countCompleted, createProgressStore, type LearningProgress } from "./progressStoreCore";

export type { LastOpened, LearningProgress, UserProgress } from "./progressStoreCore";

/**
 * App instance of the progress store, scoped to the signed-in Supabase user.
 * Screens use ONLY the hooks below (never the store), and every hook is keyed
 * by the current user id — so an account switch or logout re-renders them with
 * the new user's data (or nothing when signed out).
 */
export const useProgressStore = createProgressStore({
  getUserId: () => useAuthStore.getState().user?.id,
  storage: AsyncStorage,
});

/** Current signed-in user id (undefined when signed out). */
export const useProgressUserId = (): string | undefined => useAuthStore((s) => s.user?.id);

const EMPTY: Record<string, string> = {};

export function useCompletedCount(gridSlug: string): number {
  const uid = useProgressUserId();
  return useProgressStore((s) => (uid ? countCompleted(s.users[uid]?.completed, gridSlug) : 0));
}

/** Completed-topic counts for every course, keyed by grid slug (for list filters). */
export function useCompletedByGrid(): Record<string, number> {
  const uid = useProgressUserId();
  const completed = useProgressStore((s) => (uid ? s.users[uid]?.completed : undefined)) ?? EMPTY;
  return useMemo(() => {
    const out: Record<string, number> = {};
    for (const k in completed) {
      const grid = k.slice(0, k.indexOf("/"));
      out[grid] = (out[grid] ?? 0) + 1;
    }
    return out;
  }, [completed]);
}

/** Slugs of the topics the user has completed in one course. */
export function useCompletedSlugs(gridSlug: string): Set<string> {
  const uid = useProgressUserId();
  const completed = useProgressStore((s) => (uid ? s.users[uid]?.completed : undefined)) ?? EMPTY;
  return useMemo(() => {
    const prefix = `${gridSlug}/`;
    const out = new Set<string>();
    for (const k in completed) if (k.startsWith(prefix)) out.add(k.slice(prefix.length));
    return out;
  }, [completed, gridSlug]);
}

export const useIsTopicCompleted = (gridSlug: string, topicSlug: string): boolean => {
  const uid = useProgressUserId();
  return useProgressStore((s) => (uid ? topicKey(gridSlug, topicSlug) in (s.users[uid]?.completed ?? EMPTY) : false));
};

export const useLastOpened = () => {
  const uid = useProgressUserId();
  return useProgressStore((s) => (uid ? (s.users[uid]?.lastOpened ?? null) : null));
};

/** Current streak. Re-derived when activity changes, the user changes, or the local day rolls over on the next render. */
export function useStreak(): number {
  const uid = useProgressUserId();
  const activeDays = useProgressStore((s) => (uid ? s.users[uid]?.activeDays : undefined));
  const today = localDateKey();
  // `today` in the deps: a new local day recomputes (and possibly resets) the streak.
  return useMemo(() => computeStreak(activeDays ?? []), [activeDays, today]); // eslint-disable-line react-hooks/exhaustive-deps
}

export const useProgressActions = (): Pick<
  LearningProgress,
  "markOpened" | "markComplete" | "unmarkComplete" | "recordReadingActivity" | "setScroll" | "setReaderFontSize"
> =>
  useProgressStore(
    useShallow((s) => ({
      markOpened: s.markOpened,
      markComplete: s.markComplete,
      unmarkComplete: s.unmarkComplete,
      recordReadingActivity: s.recordReadingActivity,
      setScroll: s.setScroll,
      setReaderFontSize: s.setReaderFontSize,
    })),
  );

/**
 * One-off, non-reactive reads (e.g. "what scroll offset was saved?" at screen
 * mount). Goes through the same `LearningProgress` contract and current-user
 * scoping as the hooks.
 */
export const progressSnapshot = (): LearningProgress => useProgressStore.getState();

/**
 * Reader "Aa" size for the current user (persisted per user). Signed out, nothing
 * is recorded, so the choice lives in memory for the session only.
 */
export function useReaderFontSize(): [ReaderFontSize, (size: ReaderFontSize) => void] {
  const uid = useProgressUserId();
  const stored = useProgressStore((s) => (uid ? (s.users[uid]?.readerFontSize ?? "medium") : null));
  const [local, setLocal] = useState<ReaderFontSize>("medium");
  const { setReaderFontSize } = useProgressActions();
  const set = useCallback(
    (size: ReaderFontSize) => {
      setLocal(size);
      setReaderFontSize(size);
    },
    [setReaderFontSize],
  );
  return [stored ?? local, set];
}
