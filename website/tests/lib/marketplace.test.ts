import { describe, it, expect } from "vitest";
import {
  parsePage,
  parsePrice,
  projectSort,
  jobSort,
  totalPages,
  cleanParams,
  PROJECT_PAGE_SIZE,
} from "@/lib/marketplace";

describe("marketplace helpers", () => {
  it("parsePage clamps to >= 1 integers", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("2.9")).toBe(2);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("5")).toBe(5);
  });
  it("parsePrice accepts non-negative numbers only", () => {
    expect(parsePrice(undefined)).toBeUndefined();
    expect(parsePrice("-1")).toBeUndefined();
    expect(parsePrice("x")).toBeUndefined();
    expect(parsePrice("0")).toBe(0);
    expect(parsePrice("1499")).toBe(1499);
  });
  it("sort parsers fall back to newest on unknown keys", () => {
    expect(projectSort(undefined)).toBe("newest");
    expect(projectSort("bogus")).toBe("newest");
    expect(projectSort("price-low")).toBe("price-low");
    expect(jobSort("salary-high")).toBe("salary-high");
    expect(jobSort("nope")).toBe("newest");
  });
  it("totalPages is at least 1 and ceils", () => {
    expect(totalPages(0, PROJECT_PAGE_SIZE)).toBe(1);
    expect(totalPages(null, 10)).toBe(1);
    expect(totalPages(25, 10)).toBe(3);
    expect(totalPages(20, 10)).toBe(2);
  });
  it("cleanParams drops empty values", () => {
    expect(cleanParams({ a: "1", b: "", c: undefined, d: "x" })).toEqual({ a: "1", d: "x" });
  });
});
