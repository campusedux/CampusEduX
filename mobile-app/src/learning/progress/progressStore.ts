import { useMemo } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReaderFontSize } from "@/theme/typography";
import { addActiveDay, computeStreak, localDateKey, topicKey } from "./progressLogic";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Learning progress — the ONE seam between the Learning UI and where progress
 *  lives. Screens import only the hooks + `LearningProgress` type from here.
 *  Today it is device-local (AsyncStorage via zustand-persist). To move it to a
 *  Supabase table later, re-implement `LearningProgress` (and hydrate the same
 *  state shape) — no screen changes. All rules (streak, %) live in
 *  ./progressLogic so they move with it.
 *
 *  Caveat (local impl): progress is per DEVICE, not per account.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface LastOpened {
  gridSlug: string;
  gridName: string;
  topicSlug: string;
  topicTitle: string;
  sectionName?: string;
  /** ISO timestamp. */
  at: string;
}

export interface LearningProgress {
  // reads
  isCompleted(gridSlug: string, topicSlug: string): boolean;
  /** Completed topics recorded for a course (may exceed the published count if topics were unpublished — clamp when showing %). */
  getCompletedCount(gridSlug: string): number;
  getLastOpened(): LastOpened | null;
  getStreak(now?: Date): number;
  getScroll(gridSlug: string, topicSlug: string): number;
  getReaderFontSize(): ReaderFontSize;
  // writes
  markOpened(entry: Omit<LastOpened, "at">): void;
  /** Marks a topic complete AND counts today as an active (streak) day. */
  markComplete(gridSlug: string, topicSlug: string, now?: Date): void;
  unmarkComplete(gridSlug: string, topicSlug: string): void;
  /** Call once a learner has stayed on a topic ≥ 60 s — counts today as active. */
  recordReadingActivity(now?: Date): void;
  setScroll(gridSlug: string, topicSlug: string, offset: number): void;
  setReaderFontSize(size: ReaderFontSize): void;
}

interface ProgressState {
  /** `${grid}/${topic}` → ISO completion time. */
  completed: Record<string, string>;
  lastOpened: LastOpened | null;
  /** Sorted unique local `YYYY-MM-DD` days with qualifying activity. */
  activeDays: string[];
  scroll: Record<string, number>;
  readerFontSize: ReaderFontSize;
}

type Store = ProgressState & LearningProgress;

const MAX_SCROLL_ENTRIES = 200;

export const useProgressStore = create<Store>()(
  persist(
    (set, get) => ({
      completed: {},
      lastOpened: null,
      activeDays: [],
      scroll: {},
      readerFontSize: "medium",

      isCompleted: (g, t) => topicKey(g, t) in get().completed,
      getCompletedCount: (g) => {
        const prefix = `${g}/`;
        return Object.keys(get().completed).filter((k) => k.startsWith(prefix)).length;
      },
      getLastOpened: () => get().lastOpened,
      getStreak: (now = new Date()) => computeStreak(get().activeDays, now),
      getScroll: (g, t) => get().scroll[topicKey(g, t)] ?? 0,
      getReaderFontSize: () => get().readerFontSize,

      markOpened: (entry) => set({ lastOpened: { ...entry, at: new Date().toISOString() } }),
      markComplete: (g, t, now = new Date()) =>
        set((s) => ({
          completed: { ...s.completed, [topicKey(g, t)]: now.toISOString() },
          activeDays: addActiveDay(s.activeDays, localDateKey(now)),
        })),
      unmarkComplete: (g, t) =>
        set((s) => {
          const { [topicKey(g, t)]: _removed, ...rest } = s.completed;
          return { completed: rest };
        }),
      recordReadingActivity: (now = new Date()) =>
        set((s) => {
          const next = addActiveDay(s.activeDays, localDateKey(now));
          return next === s.activeDays ? s : { activeDays: next };
        }),
      setScroll: (g, t, offset) =>
        set((s) => {
          const entries = Object.entries({ ...s.scroll, [topicKey(g, t)]: Math.round(offset) });
          return { scroll: Object.fromEntries(entries.slice(-MAX_SCROLL_ENTRIES)) };
        }),
      setReaderFontSize: (size) => set({ readerFontSize: size }),
    }),
    {
      name: "campusedux-learning-progress",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        completed: s.completed,
        lastOpened: s.lastOpened,
        activeDays: s.activeDays,
        scroll: s.scroll,
        readerFontSize: s.readerFontSize,
      }),
    },
  ),
);

// ── Hooks: the only API screens use ─────────────────────────────────────────

export const useCompletedCount = (gridSlug: string) =>
  useProgressStore((s) => {
    const prefix = `${gridSlug}/`;
    let n = 0;
    for (const k in s.completed) if (k.startsWith(prefix)) n += 1;
    return n;
  });

/** Completed-topic counts for every course, keyed by grid slug (for list filters). */
export function useCompletedByGrid(): Record<string, number> {
  const completed = useProgressStore((s) => s.completed);
  return useMemo(() => {
    const out: Record<string, number> = {};
    for (const k in completed) {
      const grid = k.slice(0, k.indexOf("/"));
      out[grid] = (out[grid] ?? 0) + 1;
    }
    return out;
  }, [completed]);
}

export const useIsTopicCompleted = (gridSlug: string, topicSlug: string) =>
  useProgressStore((s) => topicKey(gridSlug, topicSlug) in s.completed);

export const useLastOpened = () => useProgressStore((s) => s.lastOpened);

/** Current streak. Re-derived when activity changes or the local day rolls over on the next render. */
export function useStreak(): number {
  const activeDays = useProgressStore((s) => s.activeDays);
  const today = localDateKey();
  // `today` in the deps: a new local day recomputes (and possibly resets) the streak.
  return useMemo(() => computeStreak(activeDays), [activeDays, today]); // eslint-disable-line react-hooks/exhaustive-deps
}

export const useProgressActions = () =>
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
