import { describe, expect, it } from "vitest";
import { courseAccent, coverBackground, coverGlyph, isEmojiIcon } from "@/lib/courseCover";

describe("courseAccent", () => {
  it("keeps a valid admin accent", () => {
    expect(courseAccent("#f59e0b", "java-tutorial")).toBe("#F59E0B");
  });

  it("picks a stable palette colour by slug when the accent is missing or invalid", () => {
    const a = courseAccent(null, "generative-ai");
    expect(a).toMatch(/^#[0-9A-F]{6}$/);
    expect(courseAccent(null, "generative-ai")).toBe(a);
    expect(courseAccent("red; background:url(x)", "generative-ai")).toBe(a);
  });

  it("gives the three live courses without an accent three different colours", () => {
    const picks = ["dbms-sql-tutorial", "ai-ml-notes", "generative-ai"].map((s) => courseAccent(null, s));
    expect(new Set(picks).size).toBe(3);
  });
});

describe("coverBackground", () => {
  it("builds a layered gradient with only hsl() colours (no raw admin input)", () => {
    const bg = coverBackground("#2563EB");
    expect(bg.match(/gradient\(/g)).toHaveLength(3);
    expect(bg).not.toContain("#");
  });
});

describe("coverGlyph / isEmojiIcon", () => {
  it("matches course names to a glyph, falling back to the book", () => {
    expect(coverGlyph("Java Tutorial")).toBe("coffee");
    expect(coverGlyph("DBMS & SQL Tutorial")).toBe("database");
    expect(coverGlyph("Generative AI")).toBe("sparkles");
    expect(coverGlyph("AI/ML Notes")).toBe("brain");
    expect(coverGlyph("JavaScript Basics")).toBe("code");
    expect(coverGlyph("Soft Skills")).toBe("book");
  });

  it("detects emoji icons", () => {
    expect(isEmojiIcon("🐍")).toBe(true);
    expect(isEmojiIcon("book")).toBe(false);
    expect(isEmojiIcon(null)).toBe(false);
  });
});
