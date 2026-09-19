import { addActiveDay, completionPercent, computeStreak, localDateKey, shiftDateKey } from "@/learning/progress/progressLogic";
import {
  courseTags,
  estimateCourseTime,
  firstName,
  matchesCourseFilter,
  splitHighlight,
} from "@/learning/learningFormat";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe("streak rule (local dates)", () => {
  const now = at(2026, 9, 19);

  it("is 0 with no activity", () => expect(computeStreak([], now)).toBe(0));

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-09-17", "2026-09-18", "2026-09-19"], now)).toBe(3);
  });

  it("stays alive when today isn't active yet but yesterday was", () => {
    expect(computeStreak(["2026-09-17", "2026-09-18"], now)).toBe(2);
  });

  it("resets after a full missed day", () => {
    expect(computeStreak(["2026-09-16", "2026-09-17"], now)).toBe(0);
  });

  it("a gap breaks the run (only the recent run counts)", () => {
    expect(computeStreak(["2026-09-14", "2026-09-15", "2026-09-18", "2026-09-19"], now)).toBe(2);
  });

  it("crosses month and year boundaries", () => {
    expect(computeStreak(["2026-12-31", "2027-01-01"], at(2027, 1, 1))).toBe(2);
    expect(shiftDateKey(at(2026, 3, 1), -1)).toBe("2026-02-28");
  });

  it("uses the LOCAL date, not UTC", () => {
    const lateNight = new Date(2026, 8, 19, 23, 30);
    expect(localDateKey(lateNight)).toBe("2026-09-19");
  });

  it("addActiveDay keeps the list unique, sorted, bounded", () => {
    expect(addActiveDay(["2026-09-18"], "2026-09-17")).toEqual(["2026-09-17", "2026-09-18"]);
    const same = ["2026-09-18"];
    expect(addActiveDay(same, "2026-09-18")).toBe(same);
    expect(addActiveDay(["a", "b", "c"], "d", 3)).toEqual(["b", "c", "d"]);
  });
});

describe("course completion", () => {
  it("clamps and handles 0 topics", () => {
    expect(completionPercent(3, 12)).toBe(25);
    expect(completionPercent(20, 12)).toBe(100);
    expect(completionPercent(2, 0)).toBe(0);
  });

  it("filters", () => {
    expect(matchesCourseFilter("all", 0, 10)).toBe(true);
    expect(matchesCourseFilter("in-progress", 0, 10)).toBe(false);
    expect(matchesCourseFilter("in-progress", 4, 10)).toBe(true);
    expect(matchesCourseFilter("in-progress", 10, 10)).toBe(false);
    expect(matchesCourseFilter("completed", 10, 10)).toBe(true);
    expect(matchesCourseFilter("completed", 0, 0)).toBe(false);
  });
});

describe("estimateCourseTime", () => {
  it("is hidden for 0 / missing topics", () => {
    expect(estimateCourseTime(0)).toBeNull();
    expect(estimateCourseTime(undefined)).toBeNull();
    expect(estimateCourseTime(NaN)).toBeNull();
  });
  it("always carries the ~ prefix", () => {
    for (const n of [1, 5, 8, 30, 150]) expect(estimateCourseTime(n)).toMatch(/^~\d+ (min|hrs?)$/);
    expect(estimateCourseTime(150)).toBe("~20 hrs");
    expect(estimateCourseTime(8)).toBe("~1 hr");
    expect(estimateCourseTime(3)).toBe("~25 min");
  });
});

it("tags come only from real flags", () => {
  expect(courseTags({ is_featured: false, is_premium: false })).toEqual([]);
  expect(courseTags({ is_featured: true, is_premium: false }).map((t) => t.label)).toEqual(["Popular"]);
  expect(courseTags({ is_featured: true, is_premium: true }).map((t) => t.label)).toEqual(["Popular", "Premium"]);
});

describe("splitHighlight", () => {
  it("marks case-insensitive matches of each word", () => {
    expect(splitHighlight("Introduction to Java Arrays", "java arr")).toEqual([
      { text: "Introduction to ", match: false },
      { text: "Java", match: true },
      { text: " ", match: false },
      { text: "Arr", match: true },
      { text: "ays", match: false },
    ]);
  });
  it("is safe with regex characters and empty queries", () => {
    expect(splitHighlight("a (b) c", "(b")).toEqual([
      { text: "a ", match: false },
      { text: "(b", match: true },
      { text: ") c", match: false },
    ]);
    expect(splitHighlight("hello", "")).toEqual([{ text: "hello", match: false }]);
    expect(splitHighlight("hello", "h")).toEqual([{ text: "hello", match: false }]);
  });
});

it("firstName", () => {
  expect(firstName("Ganesh Pache")).toBe("Ganesh");
  expect(firstName("")).toBe("there");
  expect(firstName(undefined)).toBe("there");
});
