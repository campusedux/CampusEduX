import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { renderToStaticMarkup } from "react-dom/server";
import { detectCallout, detectParagraphCallout, detectQuickRevision } from "@/lib/callouts";
import { Markdown } from "@/components/learning/Markdown";

describe("detectCallout", () => {
  it("recognises the two label shapes found in live content", () => {
    expect(detectCallout("**Definition:** Software testing is …")).toEqual({
      variant: "definition",
      label: "Definition",
      body: "Software testing is …",
    });
    expect(detectCallout("**Teacher's simple view:** Generative AI is not …")).toMatchObject({
      variant: "simple",
      label: "Teacher's simple view",
    });
  });

  it("supports Tip / Note / Warning in bold or plain form", () => {
    expect(detectCallout("**Tip**: use a Set")?.variant).toBe("tip");
    expect(detectCallout("Note: arrays are 0-indexed")?.variant).toBe("note");
    expect(detectCallout("**Common Mistakes:** commas in numbers")?.variant).toBe("warning");
    expect(detectCallout("**Key takeaway:** index selectively")?.variant).toBe("key");
  });

  it("leaves ordinary quotes, REPL output and unknown labels alone", () => {
    expect(detectCallout("Programs must be written for people to read.")).toBeNull();
    expect(detectCallout(">> print(2 + 3)")).toBeNull();
    expect(detectCallout(">>>>>> feature-login")).toBeNull();
    expect(detectCallout("**Output:** 5")).toBeNull();
    expect(detectCallout("Time: 10:30")).toBeNull();
  });
});

describe("detectParagraphCallout", () => {
  it("converts only the three approved paragraph labels", () => {
    expect(detectParagraphCallout("**Remember:** problem first, technique second.")).toEqual({
      variant: "key",
      subtle: true,
      label: "Remember",
      body: "problem first, technique second.",
    });
    expect(detectParagraphCallout("**Key takeaway:** a partial index narrows it")?.subtle).toBe(true);
    expect(detectParagraphCallout("**Common Mistakes:** Writing numbers with commas")).toMatchObject({
      variant: "warning",
      subtle: undefined,
    });
  });

  it("leaves every other bold-label paragraph as a paragraph", () => {
    for (const t of ["**Purpose:** the core concept", "**Output:**", "**Explanation:** x", "**Definition:** y", "Remember: plain text", "**Main idea:** z"]) {
      expect(detectParagraphCallout(t)).toBeNull();
    }
  });
});

describe("Quick revision blocks", () => {
  const BLOCK = [
    "**Purpose:** the core Generative AI concept  ",
    "**Main idea:** The topic becomes useful when its purpose and limitations are understood together.  ",
    "**Remember:** problem first, technique second, evaluation always.",
  ];

  it("detects the three-line block and keeps each line separate", () => {
    expect(detectQuickRevision(BLOCK)).toEqual([
      { label: "Purpose", body: "the core Generative AI concept" },
      { label: "Main idea", body: "The topic becomes useful when its purpose and limitations are understood together." },
      { label: "Remember", body: "problem first, technique second, evaluation always." },
    ]);
  });

  it("ignores single lines and mixed paragraphs", () => {
    expect(detectQuickRevision([BLOCK[2]])).toBeNull();
    expect(detectQuickRevision([BLOCK[0], "just some prose"])).toBeNull();
    expect(detectQuickRevision(["**Purpose:** a", "**Output:** b"])).toBeNull();
  });

  it("renders three separate rows (no run-on paragraph) when callouts are on, and is unchanged when off", () => {
    const source = `### 13. Quick revision\n${BLOCK.join("\n")}\n\nNext paragraph.`;
    const on = renderToStaticMarkup(Markdown({ source, callouts: true }));
    expect(on).toContain('aria-label="Quick revision"');
    expect((on.match(/<dt/g) ?? []).length).toBe(3);
    expect(on).toMatch(/<dt[^>]*>Purpose<\/dt>/);
    expect(on).toMatch(/<dt[^>]*>Main idea<\/dt>/);
    expect(on).toMatch(/<dt[^>]*>Remember<\/dt>/);
    // The three labels are never joined into one paragraph.
    expect(on).not.toMatch(/<p[^>]*>[^<]*Purpose[\s\S]*Main idea[\s\S]*<\/p>/);

    const off = renderToStaticMarkup(Markdown({ source }));
    expect(off).not.toContain("Quick revision</p>");
  });
});
