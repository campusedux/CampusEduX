import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { ReaderFontSize } from "@/theme/typography";
import { addActiveDay, computeStreak, localDateKey, topicKey } from "./progressLogic";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Learning progress — the ONE seam between the Learning UI and where progress
 *  lives. Today it is device-local (AsyncStorage) but SCOPED PER USER: every
 *  read and write goes to the bucket of the signed-in Supabase user id, so two
 *  accounts on one device never see each other's progress, streak or Continue
 *  card. With no signed-in user nothing is read (empty) and nothing is recorded.
 *
 *  To move it to a Supabase table later, re-implement `LearningProgress` and
 *  hydrate the same `users[userId]` shape — no screen changes. The rules
 *  (streak, %) live in ./progressLogic so they move with it.
 *
 *  This file has no auth/React import so it is unit-testable with a fake user
 *  id + in-memory storage; the app instance is wired in ./progressStore.
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

/** Everything stored for ONE user. */
export interface UserProgress {
  /** `${grid}/${topic}` → ISO completion time. */
  completed: Record<string, string>;
  lastOpened: LastOpened | null;
  /** Sorted unique local `YYYY-MM-DD` days with qualifying activity. */
  activeDays: string[];
  scroll: Record<string, number>;
  readerFontSize: ReaderFontSize;
}

export const emptyUserProgress = (): UserProgress => ({
  completed: {},
  lastOpened: null,
  activeDays: [],
  scroll: {},
  readerFontSize: "medium",
});

/** The contract screens/hooks rely on. All methods act on the CURRENT signed-in user. */
export interface LearningProgress {
  // reads (empty/default when signed out)
  isCompleted(gridSlug: string, topicSlug: string): boolean;
  getCompletedCount(gridSlug: string): number;
  getLastOpened(): LastOpened | null;
  getStreak(now?: Date): number;
  getScroll(gridSlug: string, topicSlug: string): number;
  getReaderFontSize(): ReaderFontSize;
  // writes (no-ops when signed out)
  markOpened(entry: Omit<LastOpened, "at">): void;
  /** Marks a topic complete AND counts today as an active (streak) day. */
  markComplete(gridSlug: string, topicSlug: string, now?: Date): void;
  unmarkComplete(gridSlug: string, topicSlug: string): void;
  /** Call once a learner has stayed on a topic ≥ 60 s — counts today as active. */
  recordReadingActivity(now?: Date): void;
  setScroll(gridSlug: string, topicSlug: string, offset: number): void;
  setReaderFontSize(size: ReaderFontSize): void;
}

export interface ProgressState {
  /** userId → that user's progress. */
  users: Record<string, UserProgress>;
}

export type ProgressStore = ProgressState & LearningProgress;

/** v1 was one device-wide bucket (testing only). v2 is per-user; old data is dropped. */
export const PROGRESS_STORE_VERSION = 2;
export const PROGRESS_STORAGE_KEY = "campusedux-learning-progress";
const MAX_SCROLL_ENTRIES = 200;

export function countCompleted(completed: Record<string, string> | undefined, gridSlug: string): number {
  if (!completed) return 0;
  const prefix = `${gridSlug}/`;
  let n = 0;
  for (const k in completed) if (k.startsWith(prefix)) n += 1;
  return n;
}

export function createProgressStore(opts: {
  /** Current signed-in user's id (Supabase `auth.users.id`), or nothing when signed out. */
  getUserId: () => string | null | undefined;
  storage: StateStorage;
  name?: string;
}) {
  const { getUserId } = opts;

  return create<ProgressStore>()(
    persist(
      (set, get) => {
        const read = (): UserProgress | undefined => {
          const uid = getUserId();
          return uid ? get().users[uid] : undefined;
        };
        /** Apply `fn` to the current user's bucket. No user → nothing is recorded. Returning the same object skips the update. */
        const mutate = (fn: (p: UserProgress) => UserProgress) => {
          const uid = getUserId();
          if (!uid) return;
          set((s) => {
            const cur = s.users[uid] ?? emptyUserProgress();
            const next = fn(cur);
            return next === cur && s.users[uid] ? s : { users: { ...s.users, [uid]: next } };
          });
        };

        return {
          users: {},

          isCompleted: (g, t) => topicKey(g, t) in (read()?.completed ?? {}),
          getCompletedCount: (g) => countCompleted(read()?.completed, g),
          getLastOpened: () => read()?.lastOpened ?? null,
          getStreak: (now = new Date()) => computeStreak(read()?.activeDays ?? [], now),
          getScroll: (g, t) => read()?.scroll[topicKey(g, t)] ?? 0,
          getReaderFontSize: () => read()?.readerFontSize ?? "medium",

          markOpened: (entry) => mutate((p) => ({ ...p, lastOpened: { ...entry, at: new Date().toISOString() } })),
          markComplete: (g, t, now = new Date()) =>
            mutate((p) => ({
              ...p,
              completed: { ...p.completed, [topicKey(g, t)]: now.toISOString() },
              activeDays: addActiveDay(p.activeDays, localDateKey(now)),
            })),
          unmarkComplete: (g, t) =>
            mutate((p) => {
              if (!(topicKey(g, t) in p.completed)) return p;
              const { [topicKey(g, t)]: _removed, ...rest } = p.completed;
              return { ...p, completed: rest };
            }),
          recordReadingActivity: (now = new Date()) =>
            mutate((p) => {
              const days = addActiveDay(p.activeDays, localDateKey(now));
              return days === p.activeDays ? p : { ...p, activeDays: days };
            }),
          setScroll: (g, t, offset) =>
            mutate((p) => {
              const entries = Object.entries({ ...p.scroll, [topicKey(g, t)]: Math.round(offset) });
              return { ...p, scroll: Object.fromEntries(entries.slice(-MAX_SCROLL_ENTRIES)) };
            }),
          setReaderFontSize: (size) => mutate((p) => (p.readerFontSize === size ? p : { ...p, readerFontSize: size })),
        };
      },
      {
        name: opts.name ?? PROGRESS_STORAGE_KEY,
        version: PROGRESS_STORE_VERSION,
        storage: createJSONStorage(() => opts.storage),
        partialize: (s) => ({ users: s.users }) as ProgressStore,
        // v1 (device-wide, testing data) is intentionally discarded rather than guessed at.
        migrate: (persisted, version) => (version < PROGRESS_STORE_VERSION ? { users: {} } : persisted) as ProgressStore,
      },
    ),
  );
}
