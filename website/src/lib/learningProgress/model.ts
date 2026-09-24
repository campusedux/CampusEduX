/**
 * Learning progress — pure model (no React, no browser APIs), so every rule
 * here is unit-testable and the storage backend can change without touching it.
 *
 * DEVICE-ONLY TODAY: the state below is persisted by `store.ts` in
 * localStorage, so it lives in one browser on one device and is not shared
 * with the mobile app or other devices. There is no backend table for lesson
 * completion / last visited / streak / daily goal yet — see "needs backend
 * later" in the redesign notes. When one exists, replace the adapter in
 * `store.ts`; this model and every UI consumer stay as they are.
 *
 * Vocabulary: a "course" is a Learning grid (keyed by grid slug) and a
 * "lesson" is a Learning topic (keyed by topic slug within its grid).
 */

export const PROGRESS_VERSION = 1;
export const DEFAULT_DAILY_GOAL = 1;
export const MAX_DAILY_GOAL = 10;
/** Activity older than this is dropped on write — enough for streak + a month view. */
export const ACTIVITY_RETENTION_DAYS = 120;

/** Local calendar day, `YYYY-MM-DD`. */
export type DayKey = string;

export interface LessonRef {
  gridSlug: string;
  gridName: string;
  topicSlug: string;
  topicTitle: string;
  sectionName?: string;
}

export interface LastVisited extends LessonRef {
  /** ISO timestamp. */
  at: string;
}

export interface CourseProgress {
  gridName: string;
  /** topicSlug → ISO timestamp of completion. */
  completed: Record<string, string>;
  lastVisited?: LastVisited;
}

export interface DayActivity {
  /** Lessons opened that day (counts toward the streak). */
  visits: number;
  /** Lessons marked complete that day (counts toward the streak AND the daily goal). */
  completed: number;
}

export interface LearningProgressState {
  version: number;
  courses: Record<string, CourseProgress>;
  /** Most recent lesson across all courses — drives "Continue learning". */
  lastVisited: LastVisited | null;
  activity: Record<DayKey, DayActivity>;
  /** Lessons to complete per day. */
  dailyGoal: number;
  /** Longest streak ever reached (days), kept so it survives activity pruning. */
  bestStreak: number;
}

export function emptyState(): LearningProgressState {
  return { version: PROGRESS_VERSION, courses: {}, lastVisited: null, activity: {}, dailyGoal: DEFAULT_DAILY_GOAL, bestStreak: 0 };
}

// ---------------------------------------------------------------------------
// Dates — always the visitor's LOCAL calendar day, so "today" matches their clock.
// ---------------------------------------------------------------------------

export function dayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ---------------------------------------------------------------------------
// Parsing — anything unexpected in storage degrades to an empty/partial state,
// never a crash.
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);
const nonNegInt = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

function parseLastVisited(v: unknown): LastVisited | undefined {
  if (!isObj(v)) return undefined;
  const gridSlug = str(v.gridSlug);
  const topicSlug = str(v.topicSlug);
  const at = str(v.at);
  if (!gridSlug || !topicSlug || !at) return undefined;
  return {
    gridSlug,
    topicSlug,
    at,
    gridName: str(v.gridName) ?? gridSlug,
    topicTitle: str(v.topicTitle) ?? topicSlug,
    sectionName: str(v.sectionName),
  };
}

export function parseState(raw: string | null | undefined): LearningProgressState {
  if (!raw) return emptyState();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyState();
  }
  if (!isObj(data)) return emptyState();

  const state = emptyState();
  if (isObj(data.courses)) {
    for (const [slug, c] of Object.entries(data.courses)) {
      if (!isObj(c)) continue;
      const completed: Record<string, string> = {};
      if (isObj(c.completed)) {
        for (const [topic, at] of Object.entries(c.completed)) if (str(at)) completed[topic] = at as string;
      }
      state.courses[slug] = { gridName: str(c.gridName) ?? slug, completed, lastVisited: parseLastVisited(c.lastVisited) };
    }
  }
  state.lastVisited = parseLastVisited(data.lastVisited) ?? null;
  if (isObj(data.activity)) {
    for (const [day, a] of Object.entries(data.activity)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isObj(a)) continue;
      state.activity[day] = { visits: nonNegInt(a.visits), completed: nonNegInt(a.completed) };
    }
  }
  const goal = nonNegInt(data.dailyGoal);
  state.dailyGoal = goal > 0 ? Math.min(goal, MAX_DAILY_GOAL) : DEFAULT_DAILY_GOAL;
  state.bestStreak = nonNegInt(data.bestStreak);
  return state;
}

// ---------------------------------------------------------------------------
// Updates — pure: each returns a NEW state.
// ---------------------------------------------------------------------------

function bumpActivity(state: LearningProgressState, now: Date, field: keyof DayActivity): Record<DayKey, DayActivity> {
  const today = dayKey(now);
  const cutoff = dayKey(addDays(now, -ACTIVITY_RETENTION_DAYS));
  const activity: Record<DayKey, DayActivity> = {};
  for (const [day, a] of Object.entries(state.activity)) if (day >= cutoff) activity[day] = a;
  const cur = activity[today] ?? { visits: 0, completed: 0 };
  activity[today] = { ...cur, [field]: cur[field] + 1 };
  return activity;
}

function withBestStreak(state: LearningProgressState, now: Date): LearningProgressState {
  const { current } = computeStreak(state.activity, now);
  return current > state.bestStreak ? { ...state, bestStreak: current } : state;
}

function course(state: LearningProgressState, lesson: LessonRef): CourseProgress {
  return state.courses[lesson.gridSlug] ?? { gridName: lesson.gridName, completed: {} };
}

/** A lesson was opened: updates "continue learning" and today's activity. */
export function recordVisit(state: LearningProgressState, lesson: LessonRef, now: Date): LearningProgressState {
  const last: LastVisited = { ...lesson, at: now.toISOString() };
  const c = course(state, lesson);
  return withBestStreak(
    {
      ...state,
      lastVisited: last,
      courses: { ...state.courses, [lesson.gridSlug]: { ...c, gridName: lesson.gridName, lastVisited: last } },
      activity: bumpActivity(state, now, "visits"),
    },
    now,
  );
}

export function markComplete(state: LearningProgressState, lesson: LessonRef, now: Date): LearningProgressState {
  const c = course(state, lesson);
  if (c.completed[lesson.topicSlug]) return state; // idempotent — no double-counting the daily goal
  return withBestStreak(
    {
      ...state,
      courses: {
        ...state.courses,
        [lesson.gridSlug]: { ...c, gridName: lesson.gridName, completed: { ...c.completed, [lesson.topicSlug]: now.toISOString() } },
      },
      activity: bumpActivity(state, now, "completed"),
    },
    now,
  );
}

/** Undo a completion. Today's activity count is left alone — the reading still happened. */
export function markIncomplete(state: LearningProgressState, gridSlug: string, topicSlug: string): LearningProgressState {
  const c = state.courses[gridSlug];
  if (!c?.completed[topicSlug]) return state;
  const completed = { ...c.completed };
  delete completed[topicSlug];
  return { ...state, courses: { ...state.courses, [gridSlug]: { ...c, completed } } };
}

/**
 * Drop progress that points at lessons no longer in the course (renamed or
 * deleted by an admin): stale completions stop inflating the percentage, and a
 * stale "last visited" is cleared so "Continue learning" never links to a
 * missing lesson. Returns the same object when nothing changed.
 */
export function reconcileCourse(state: LearningProgressState, gridSlug: string, validTopicSlugs: Iterable<string>): LearningProgressState {
  const valid = new Set(validTopicSlugs);
  const c = state.courses[gridSlug];
  const globalStale = state.lastVisited?.gridSlug === gridSlug && !valid.has(state.lastVisited.topicSlug);
  if (!c && !globalStale) return state;

  let changed = globalStale;
  let nextCourse = c;
  if (c) {
    const completed: Record<string, string> = {};
    for (const [slug, at] of Object.entries(c.completed)) {
      if (valid.has(slug)) completed[slug] = at;
      else changed = true;
    }
    const lastStale = !!c.lastVisited && !valid.has(c.lastVisited.topicSlug);
    if (lastStale) changed = true;
    nextCourse = { ...c, completed, lastVisited: lastStale ? undefined : c.lastVisited };
  }
  if (!changed) return state;
  return {
    ...state,
    lastVisited: globalStale ? null : state.lastVisited,
    courses: nextCourse ? { ...state.courses, [gridSlug]: nextCourse } : state.courses,
  };
}

/** First lesson (in course order) that isn't complete yet; `null` when all are done. */
export function firstIncomplete(state: LearningProgressState, gridSlug: string, orderedTopicSlugs: string[]): string | null {
  const done = state.courses[gridSlug]?.completed ?? {};
  return orderedTopicSlugs.find((slug) => !done[slug]) ?? null;
}

export function setDailyGoal(state: LearningProgressState, goal: number): LearningProgressState {
  const g = Math.min(MAX_DAILY_GOAL, Math.max(1, Math.floor(goal) || DEFAULT_DAILY_GOAL));
  return { ...state, dailyGoal: g };
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

const isActive = (a: DayActivity | undefined) => !!a && (a.visits > 0 || a.completed > 0);

export interface StreakInfo {
  /** Consecutive active days ending today — or ending yesterday, so a streak
   *  isn't shown as broken until a whole day has actually been missed. */
  current: number;
  activeToday: boolean;
}

export function computeStreak(activity: Record<DayKey, DayActivity>, now: Date): StreakInfo {
  const activeToday = isActive(activity[dayKey(now)]);
  let cursor = activeToday ? now : addDays(now, -1);
  let current = 0;
  while (isActive(activity[dayKey(cursor)])) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, activeToday };
}

export interface DailyGoalInfo {
  goal: number;
  completedToday: number;
  met: boolean;
}

export function dailyGoalInfo(state: LearningProgressState, now: Date): DailyGoalInfo {
  const completedToday = state.activity[dayKey(now)]?.completed ?? 0;
  return { goal: state.dailyGoal, completedToday, met: completedToday >= state.dailyGoal };
}

/** Last `days` days, oldest first — for a week strip / heatmap. */
export function recentDays(state: LearningProgressState, now: Date, days = 7): { day: DayKey; active: boolean; completed: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const day = dayKey(addDays(now, i - (days - 1)));
    const a = state.activity[day];
    return { day, active: isActive(a), completed: a?.completed ?? 0 };
  });
}

export interface CourseProgressInfo {
  completed: number;
  total: number;
  /** 0–100, rounded; 0 when `total` is unknown (0). */
  percent: number;
  started: boolean;
  lastVisited?: LastVisited;
}

/** `total` comes from the caller (the grid's topic count) — it isn't stored. */
export function courseProgress(state: LearningProgressState, gridSlug: string, total: number): CourseProgressInfo {
  const c = state.courses[gridSlug];
  const completed = c ? Object.keys(c.completed).length : 0;
  const safeTotal = Math.max(0, total);
  const percent = safeTotal > 0 ? Math.min(100, Math.round((completed / safeTotal) * 100)) : 0;
  return { completed, total: safeTotal, percent, started: !!c && (completed > 0 || !!c.lastVisited), lastVisited: c?.lastVisited };
}

export function totalCompleted(state: LearningProgressState): number {
  return Object.values(state.courses).reduce((n, c) => n + Object.keys(c.completed).length, 0);
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

/** Achievement badges — derived, never stored, so the rules can change freely. */
export function deriveBadges(state: LearningProgressState, now: Date): Badge[] {
  const done = totalCompleted(state);
  const streak = Math.max(state.bestStreak, computeStreak(state.activity, now).current);
  const coursesTouched = Object.values(state.courses).filter((c) => Object.keys(c.completed).length > 0).length;
  return [
    { id: "first-lesson", title: "First step", description: "Complete your first lesson", earned: done >= 1 },
    { id: "ten-lessons", title: "On a roll", description: "Complete 10 lessons", earned: done >= 10 },
    { id: "fifty-lessons", title: "Deep diver", description: "Complete 50 lessons", earned: done >= 50 },
    { id: "streak-3", title: "Warming up", description: "Learn 3 days in a row", earned: streak >= 3 },
    { id: "streak-7", title: "Week warrior", description: "Learn 7 days in a row", earned: streak >= 7 },
    { id: "explorer", title: "Explorer", description: "Complete lessons in 3 different courses", earned: coursesTouched >= 3 },
  ];
}
