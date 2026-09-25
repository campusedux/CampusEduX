import { describe, expect, it } from "vitest";
import { clampAtWord, leadingProse, lessonMetaDescription } from "@/lib/metaDescription";

describe("clampAtWord", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(clampAtWord("A short\n\nsummary.")).toBe("A short summary.");
  });

  it("cuts at a word boundary with an ellipsis, within the limit", () => {
    const out = clampAtWord("JRE (Java Runtime Environment) is the JVM plus the libraries needed to run Java programs", 60);
    expect(out).toBe("JRE (Java Runtime Environment) is the JVM plus the…");
    expect(out.length).toBeLessThanOrEqual(60);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(clampAtWord("one two three, four five six seven", 16)).toBe("one two three…");
  });
});

describe("leadingProse", () => {
  // Opening of the live DBMS "ALL" lesson (2026-09-25).
  const ALL = [
    "### What ALL Really Means",
    "",
    "`x > ALL (subquery)` is TRUE only if `x` is greater than **every single row** the subquery returns.",
    "",
    "```sql",
    "SELECT 1;",
    "```",
  ].join("\n");

  it("skips headings, code fences and emphasis markers", () => {
    expect(leadingProse(ALL)).toBe("x > ALL (subquery) is TRUE only if x is greater than every single row the subquery returns.");
  });

  it("skips tables, rules and images", () => {
    const src = "| a | b |\n|---|---|\n| 1 | 2 |\n\n---\n\n![diagram](/d.svg)\n\nThe real opening.";
    expect(leadingProse(src)).toBe("The real opening.");
  });

  it("keeps blockquote and list text, without their markers", () => {
    expect(leadingProse("> **Note:** Read this first.\n\n- Then this.")).toBe("Note: Read this first. Then this.");
  });
});

describe("lessonMetaDescription", () => {
  it("prefers the authored short description", () => {
    expect(lessonMetaDescription("Stored summary.", ["### Definition\nBody text."], "fallback")).toBe("Stored summary.");
  });

  it("falls back to the body's opening prose (DBMS lessons have no short description)", () => {
    const body = "### Definition\nThe **cardinality** of a relation is the number of tuples (rows) it currently contains.";
    expect(lessonMetaDescription("", [body], "fallback")).toBe(
      "The cardinality of a relation is the number of tuples (rows) it currently contains.",
    );
  });

  it("never exceeds 155 characters and never ends mid-word", () => {
    const long = "word ".repeat(80);
    const out = lessonMetaDescription(null, [long], "fallback");
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("word…")).toBe(true);
  });

  it("uses the fallback when there is no prose at all", () => {
    expect(lessonMetaDescription("  ", ["```java\nint x;\n```"], "ALL — DBMS & SQL Tutorial on CampusEduX.")).toBe(
      "ALL — DBMS & SQL Tutorial on CampusEduX.",
    );
  });
});
