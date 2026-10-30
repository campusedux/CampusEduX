import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonBlock } from "@/components/learning/LessonBlock";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const directory = path.resolve(process.cwd(), "content/dbms-sql/topics");
const packages = readdirSync(directory).filter((name) => name.endsWith(".json")).map((name) =>
  JSON.parse(readFileSync(path.join(directory, name), "utf8")) as {
    slug: string; title: string; description: string; notes: string; diagrams?: unknown[];
  },
);

describe("authored DBMS packages through the actual article renderer", () => {
  it.each(packages)("renders $slug with readable notes and descriptive heading hierarchy", (topic) => {
    const html = renderToStaticMarkup(createElement("article", null,
      createElement("h1", null, topic.title),
      createElement(LessonBlock, { block: { heading: topic.title, body: topic.notes, content_format: "markdown", metadata: { dbms_diagrams_v1: topic.diagrams ?? [] } } }),
    ));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("<p");
    expect(html).not.toContain("[object Object]");
    const headings = [...html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g)].map((match) => match[1].replace(/<[^>]+>/g, ""));
    expect(headings.length).toBeGreaterThan(3);
    for (const heading of headings) expect(heading).not.toMatch(/\b(?:chapter|unit|module|lesson|part|section)\b/i);
    expect(topic.description.trim().length).toBeGreaterThan(50);
    if (topic.diagrams?.length) {
      expect(html.match(/<figcaption\b/g)).toHaveLength(topic.diagrams.length);
      if (topic.diagrams.some((d) => (d as { kind: string }).kind === "table")) {
        expect(html).toContain('scope="col"');
        expect(html).toContain('scope="row"');
        expect(html).toContain("<caption");
      }
      if (topic.diagrams.some((d) => (d as { kind: string }).kind === "weak-entity-er")) {
        expect(html).toContain('<svg');
        expect(html).toContain('role="img"');
        expect(html).toContain('stroke-dasharray="5 4"');
      }
      expect(html).toContain('role="region"');
      expect(html).toContain('tabindex="0"');
    }
  });
});
