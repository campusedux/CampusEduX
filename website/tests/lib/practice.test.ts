import { describe, it, expect } from "vitest";
import {
  parsePracticeQuery,
  practiceParams,
  totalPages,
  PRACTICE_PAGE_SIZE,
  PRACTICE_CRUMBS,
} from "@/lib/practice.types";

describe("parsePracticeQuery", () => {
  it("defaults to page 1 and no filters", () => {
    expect(parsePracticeQuery({})).toEqual({
      difficulty: undefined,
      category: undefined,
      lang: undefined,
      q: undefined,
      status: undefined,
      page: 1,
    });
  });

  it("canonicalises difficulty case-insensitively and drops bad values", () => {
    expect(parsePracticeQuery({ difficulty: "easy" }).difficulty).toBe("Easy");
    expect(parsePracticeQuery({ difficulty: "MEDIUM" }).difficulty).toBe("Medium");
    expect(parsePracticeQuery({ difficulty: "impossible" }).difficulty).toBeUndefined();
  });

  it("accepts a slug-shaped category and rejects anything else", () => {
    expect(parsePracticeQuery({ category: "searching-and-sorting" }).category).toBe("searching-and-sorting");
    expect(parsePracticeQuery({ category: "Arrays!" }).category).toBeUndefined();
    expect(parsePracticeQuery({ category: "../etc" }).category).toBeUndefined();
  });

  it("only keeps a supported language", () => {
    expect(parsePracticeQuery({ lang: "cpp" }).lang).toBe("cpp");
    expect(parsePracticeQuery({ lang: "PYTHON" }).lang).toBe("python");
    expect(parsePracticeQuery({ lang: "rust" }).lang).toBeUndefined();
  });

  it("trims + caps the search term at 80 chars", () => {
    expect(parsePracticeQuery({ q: "  two sum  " }).q).toBe("two sum");
    expect(parsePracticeQuery({ q: "x".repeat(200) }).q).toHaveLength(80);
    expect(parsePracticeQuery({ q: "   " }).q).toBeUndefined();
  });

  it("only accepts solved / unsolved for status", () => {
    expect(parsePracticeQuery({ status: "solved" }).status).toBe("solved");
    expect(parsePracticeQuery({ status: "unsolved" }).status).toBe("unsolved");
    expect(parsePracticeQuery({ status: "maybe" }).status).toBeUndefined();
  });

  it("parses page, clamps to >= 1 and an upper bound, takes the first of an array", () => {
    expect(parsePracticeQuery({ page: "3" }).page).toBe(3);
    expect(parsePracticeQuery({ page: "0" }).page).toBe(1);
    expect(parsePracticeQuery({ page: "-5" }).page).toBe(1);
    expect(parsePracticeQuery({ page: "abc" }).page).toBe(1);
    expect(parsePracticeQuery({ page: "99999999" }).page).toBe(10000);
    expect(parsePracticeQuery({ page: ["2", "9"] }).page).toBe(2);
  });
});

describe("practiceParams", () => {
  it("drops empties and page <= 1", () => {
    expect(practiceParams({ page: 1 })).toEqual({});
    expect(practiceParams({ difficulty: "Easy", page: 2, q: "sum" })).toEqual({
      difficulty: "Easy",
      page: "2",
      q: "sum",
    });
    expect(practiceParams({ category: "arrays", status: "solved", lang: "java", page: undefined })).toEqual({
      category: "arrays",
      status: "solved",
      lang: "java",
    });
  });
});

describe("totalPages", () => {
  it("is at least 1 and rounds up", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(1)).toBe(1);
    expect(totalPages(PRACTICE_PAGE_SIZE)).toBe(1);
    expect(totalPages(PRACTICE_PAGE_SIZE + 1)).toBe(2);
    expect(totalPages(100, 24)).toBe(5);
  });
});

describe("PRACTICE_CRUMBS", () => {
  it("is Practice -> Coding Problems -> Coding Problem, last crumb has no href", () => {
    expect(PRACTICE_CRUMBS.map((c) => c.label)).toEqual(["Practice", "Coding Problems", "Coding Problem"]);
    expect(PRACTICE_CRUMBS[0].href).toBe("/practice");
    expect(PRACTICE_CRUMBS[PRACTICE_CRUMBS.length - 1].href).toBeUndefined();
  });
});
