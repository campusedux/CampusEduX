/**
 * Pure progress rules — no React, no storage — so they can move to the backend
 * (or be unit-tested) unchanged.
 *
 * STREAK RULE: a calendar day (in the DEVICE's local timezone) is "active" if
 * the learner marked a topic complete OR kept a topic reader open for ≥ 60 s.
 * The streak is the run of consecutive active days ending today — or ending
 * yesterday, so the streak is still alive (not yet lost) until the day is over.
 * Missing one full day resets it to 0.
 */

/** Seconds a learner must stay on a topic for that day to count as active. */
export const READING_ACTIVITY_SECONDS = 60;

const pad = (n: number) => String(n).padStart(2, "0");

/** Local `YYYY-MM-DD` (NOT UTC — the streak follows the device's calendar day). */
export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local date key `offset` calendar days from `d` (DST-safe: uses Y/M/D arithmetic, not 24h steps). */
export function shiftDateKey(d: Date, offset: number): string {
  return localDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset));
}

export function computeStreak(activeDays: readonly string[], now: Date = new Date()): number {
  if (activeDays.length === 0) return 0;
  const days = new Set(activeDays);
  let offset = days.has(shiftDateKey(now, 0)) ? 0 : days.has(shiftDateKey(now, -1)) ? -1 : null;
  if (offset === null) return 0;
  let streak = 0;
  while (days.has(shiftDateKey(now, offset))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

/** Add a day, keeping the list unique + sorted and bounded (streaks never need >1y of history). */
export function addActiveDay(activeDays: readonly string[], dayKey: string, keep = 400): string[] {
  if (activeDays.includes(dayKey)) return activeDays as string[];
  return [...activeDays, dayKey].sort().slice(-keep);
}

export const topicKey = (gridSlug: string, topicSlug: string) => `${gridSlug}/${topicSlug}`;

/** Whole-number course completion %, clamped 0–100 (completed rows for since-unpublished topics can't push it past 100). */
export function completionPercent(completed: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}
