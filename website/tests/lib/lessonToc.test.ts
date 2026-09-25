import { describe, expect, it } from "vitest";
import { lessonToc, lessonReadingMinutes } from "@/lib/lessonToc";
import { slugId } from "@/lib/blogText";

describe("lessonToc", () => {
  it("uses the same ids the renderer stamps (raw heading text) and skips fenced code", () => {
    const toc = lessonToc([
      { heading: "", content_format: "markdown", body: "## 1. What is `snake_case`?\n\n```\n## not a heading\n```\n### Sub part" },
    ]);
    expect(toc).toEqual([
      { id: slugId("1. What is `snake_case`?"), text: "1. What is snake_case?", level: 2 },
      { id: "sub-part", text: "Sub part", level: 3 },
    ]);
  });

  it("puts block headings first, demotes their inner ## and dedupes ids", () => {
    const toc = lessonToc([
      { heading: "Loops", content_format: "markdown", body: "## For loop\n## For loop" },
      { heading: "Loops", content_format: "plain", body: "## ignored in plain" },
    ]);
    expect(toc.map((t) => [t.text, t.level])).toEqual([
      ["Loops", 2],
      ["For loop", 3],
    ]);
  });

  it("estimates at least one minute of reading", () => {
    expect(lessonReadingMinutes([{ heading: "", content_format: "markdown", body: "short" }])).toBe(1);
    const long = Array.from({ length: 1000 }, () => "word").join(" ");
    expect(lessonReadingMinutes([{ heading: "", content_format: "markdown", body: long }])).toBe(5);
  });
});
