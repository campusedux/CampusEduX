import { describe, it, expect } from "vitest";
import { noteCategory, NOTE_CATEGORIES } from "@/lib/placement";

describe("noteCategory", () => {
  it("returns a valid category unchanged", () => {
    for (const c of NOTE_CATEGORIES) expect(noteCategory(c)).toBe(c);
  });
  it("rejects unknown / empty values", () => {
    expect(noteCategory(undefined)).toBeUndefined();
    expect(noteCategory("")).toBeUndefined();
    expect(noteCategory("Random")).toBeUndefined();
    expect(noteCategory("aptitude")).toBeUndefined(); // case-sensitive by design
  });
});
