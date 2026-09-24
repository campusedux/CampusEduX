/**
 * Learning progress service — the ONE place that knows where progress lives.
 *
 * DEVICE-ONLY: backed by localStorage (per browser, per device; cleared with
 * site data; not synced to the app or other devices). To move progress to
 * Supabase later, reimplement `load` / `save` here (or swap this module for one
 * with the same exports) — the pure rules in `model.ts` and every component
 * that uses `useLearningProgress()` stay unchanged.
 *
 * The store keeps one in-memory snapshot, notifies subscribers on change, and
 * follows writes from other tabs via the `storage` event.
 */
import {
  emptyState,
  markComplete as markCompleteModel,
  markIncomplete as markIncompleteModel,
  parseState,
  reconcileCourse as reconcileCourseModel,
  recordVisit as recordVisitModel,
  setDailyGoal as setDailyGoalModel,
  type LearningProgressState,
  type LessonRef,
} from "./model";

export const PROGRESS_STORAGE_KEY = "cex-learning-progress-v1";

type Listener = () => void;

let snapshot: LearningProgressState | null = null;
const listeners = new Set<Listener>();
let storageListenerAttached = false;

/** Stable empty state for the server render / before hydration. */
const SERVER_SNAPSHOT: LearningProgressState = emptyState();

function load(): LearningProgressState {
  try {
    return parseState(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
  } catch {
    return emptyState(); // storage blocked (private mode / disabled) — progress just isn't kept
  }
}

function save(state: LearningProgressState): void {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / blocked — keep the in-memory copy for this page view */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

function attachStorageListener(): void {
  if (storageListenerAttached || typeof window === "undefined") return;
  storageListenerAttached = true;
  window.addEventListener("storage", (e) => {
    if (e.key !== PROGRESS_STORAGE_KEY) return;
    snapshot = load();
    emit();
  });
}

export function getSnapshot(): LearningProgressState {
  if (snapshot === null) snapshot = load();
  return snapshot;
}

export function getServerSnapshot(): LearningProgressState {
  return SERVER_SNAPSHOT;
}

export function subscribe(listener: Listener): () => void {
  attachStorageListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(fn: (s: LearningProgressState) => LearningProgressState): void {
  const prev = getSnapshot();
  const next = fn(prev);
  if (next === prev) return;
  snapshot = next;
  save(next);
  emit();
}

export const learningProgressService = {
  recordVisit: (lesson: LessonRef) => update((s) => recordVisitModel(s, lesson, new Date())),
  markComplete: (lesson: LessonRef) => update((s) => markCompleteModel(s, lesson, new Date())),
  markIncomplete: (gridSlug: string, topicSlug: string) => update((s) => markIncompleteModel(s, gridSlug, topicSlug)),
  setDailyGoal: (goal: number) => update((s) => setDailyGoalModel(s, goal)),
  /** Prune progress for lessons that no longer exist in this course. */
  reconcileCourse: (gridSlug: string, validTopicSlugs: string[]) =>
    update((s) => reconcileCourseModel(s, gridSlug, validTopicSlugs)),
};

/** Test hook: forget the cached snapshot so the next read re-loads storage. */
export function __resetForTests(): void {
  snapshot = null;
}
