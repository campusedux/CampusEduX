import { describe, expect, it } from "vitest";
import {
  addDays,
  computeStreak,
  courseProgress,
  dailyGoalInfo,
  dayKey,
  deriveBadges,
  emptyState,
  markComplete,
  markIncomplete,
  parseState,
  recentDays,
  recordVisit,
  setDailyGoal,
  ACTIVITY_RETENTION_DAYS,
  MAX_DAILY_GOAL,
  type LessonRef,
} from "@/lib/learningProgress/model";

const lesson = (topicSlug: string, gridSlug = "java-tutorial"): LessonRef => ({
  gridSlug,
  gridName: gridSlug === "java-tutorial" ? "Java Tutorial" : gridSlug,
  topicSlug,
  topicTitle: topicSlug.replace(/-/g, " "),
  sectionName: "Basics",
});

// Midday local time so addDays never crosses a DST edge into the wrong day.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0);

describe("learning progress model", () => {
  it("records the last visited lesson globally and per course", () => {
    const now = at(2026, 9, 24);
    const s = recordVisit(emptyState(), lesson("variables"), now);
    expect(s.lastVisited).toMatchObject({ gridSlug: "java-tutorial", topicSlug: "variables", gridName: "Java Tutorial" });
    expect(s.courses["java-tutorial"].lastVisited?.topicSlug).toBe("variables");
    expect(s.activity[dayKey(now)]).toEqual({ visits: 1, completed: 0 });
  });

  it("marks lessons complete idempotently and counts toward the daily goal once", () => {
    const now = at(2026, 9, 24);
    let s = markComplete(emptyState(), lesson("variables"), now);
    const again = markComplete(s, lesson("variables"), now);
    expect(again).toBe(s);
    s = markComplete(s, lesson("loops"), now);
    expect(dailyGoalInfo(s, now)).toEqual({ goal: 1, completedToday: 2, met: true });
    expect(courseProgress(s, "java-tutorial", 10)).toMatchObject({ completed: 2, total: 10, percent: 20, started: true });
  });

  it("un-completing removes the lesson but keeps the day's activity", () => {
    const now = at(2026, 9, 24);
    let s = markComplete(emptyState(), lesson("variables"), now);
    s = markIncomplete(s, "java-tutorial", "variables");
    expect(courseProgress(s, "java-tutorial", 10).completed).toBe(0);
    expect(s.activity[dayKey(now)].completed).toBe(1);
    expect(markIncomplete(s, "java-tutorial", "nope")).toBe(s);
  });

  it("computes streaks across consecutive local days and tolerates a not-yet-active today", () => {
    const d1 = at(2026, 9, 21);
    let s = recordVisit(emptyState(), lesson("a"), d1);
    s = recordVisit(s, lesson("b"), addDays(d1, 1));
    s = recordVisit(s, lesson("c"), addDays(d1, 2)); // 23rd
    // Checked on the 24th before doing anything: streak still alive (ends yesterday).
    expect(computeStreak(s.activity, at(2026, 9, 24))).toEqual({ current: 3, activeToday: false });
    // A full missed day breaks it.
    expect(computeStreak(s.activity, at(2026, 9, 25)).current).toBe(0);
    expect(s.bestStreak).toBe(3);
  });

  it("clamps the daily goal and parses stored values defensively", () => {
    expect(setDailyGoal(emptyState(), 99).dailyGoal).toBe(MAX_DAILY_GOAL);
    expect(setDailyGoal(emptyState(), 0).dailyGoal).toBe(1);
    expect(parseState("not json")).toEqual(emptyState());
    expect(parseState(null)).toEqual(emptyState());
    const parsed = parseState(
      JSON.stringify({ courses: { x: { completed: { a: "2026-09-01", b: 5 } } }, activity: { bad: {}, "2026-09-01": { visits: 2 } }, dailyGoal: -3 }),
    );
    expect(Object.keys(parsed.courses.x.completed)).toEqual(["a"]);
    expect(parsed.activity).toEqual({ "2026-09-01": { visits: 2, completed: 0 } });
    expect(parsed.dailyGoal).toBe(1);
  });

  it("round-trips through JSON", () => {
    const now = at(2026, 9, 24);
    const s = markComplete(recordVisit(emptyState(), lesson("variables"), now), lesson("variables"), now);
    expect(parseState(JSON.stringify(s))).toEqual(s);
  });

  it("prunes activity older than the retention window on write", () => {
    const old = at(2026, 1, 1);
    let s = recordVisit(emptyState(), lesson("a"), old);
    const now = addDays(old, ACTIVITY_RETENTION_DAYS + 5);
    s = recordVisit(s, lesson("b"), now);
    expect(Object.keys(s.activity)).toEqual([dayKey(now)]);
  });

  it("builds a 7-day strip ending today and derives badges", () => {
    const now = at(2026, 9, 24);
    const s = markComplete(emptyState(), lesson("a"), now);
    const week = recentDays(s, now, 7);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ day: "2026-09-24", active: true, completed: 1 });
    expect(week[0].active).toBe(false);
    const badges = deriveBadges(s, now);
    expect(badges.find((b) => b.id === "first-lesson")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "streak-7")?.earned).toBe(false);
  });

  it("reports 0% (not NaN) when the lesson total is unknown", () => {
    expect(courseProgress(emptyState(), "x", 0)).toMatchObject({ percent: 0, started: false });
  });
});
