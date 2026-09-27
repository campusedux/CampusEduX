import { describe, expect, it } from "vitest";
import { CONTENT_REDIRECTS, isRedirectedPath } from "@/lib/contentRedirects";
import { buildLearningEntries, renderUrlset } from "@/lib/sitemap/build";
import { selectRelatedLessons } from "@/lib/learningDiscovery";
import type { LearningTree } from "@/lib/learning.types";

/**
 * Owner-approved duplicate-page merges (website/seo-report.md §d: Tier 1 +
 * Java garbage-collector → garbage-collection). The 301s are served by
 * next.config.js from the same list the sitemap and related-lesson code read.
 */
async function configuredRedirects() {
  const { default: nextConfig } = await import("../../next.config.js");
  return (await nextConfig.redirects?.()) ?? [];
}

describe("content redirects (301)", () => {
  it("covers exactly the approved Tier 1 pages and garbage-collector", () => {
    expect(CONTENT_REDIRECTS.map((r) => [r.source, r.destination])).toEqual([
      ["/learning/generative-ai/text-to-video-u8", "/learning/generative-ai/text-to-video"],
      ["/learning/generative-ai/structured-outputs", "/learning/generative-ai/structured-output"],
      ["/coding-problems/genai-structured-outputs-1", "/coding-problems/genai-structured-output-1"],
      ["/coding-problems/genai-structured-outputs-2", "/coding-problems/genai-structured-output-2"],
      ["/coding-problems/genai-structured-outputs-3", "/coding-problems/genai-structured-output-3"],
      ["/coding-problems/genai-structured-outputs-4", "/coding-problems/genai-structured-output-4"],
      ["/learning/java-tutorial/garbage-collector", "/learning/java-tutorial/garbage-collection"],
    ]);
  });

  it("next.config.js serves each one as a literal 301", async () => {
    const redirects = await configuredRedirects();
    for (const r of CONTENT_REDIRECTS) {
      expect(redirects).toContainEqual({ source: r.source, destination: r.destination, statusCode: 301 });
    }
  });

  it("never chains or loops (no destination is itself redirected)", () => {
    for (const r of CONTENT_REDIRECTS) {
      expect(isRedirectedPath(r.destination)).toBe(false);
      expect(r.source).not.toBe(r.destination);
    }
  });

  it("redirected lessons are dropped from the sitemap", () => {
    const entries = buildLearningEntries(
      [
        { grid_slug: "java-tutorial", topic_slug: "garbage-collection", updated_at: "2026-01-01T00:00:00Z" },
        { grid_slug: "java-tutorial", topic_slug: "garbage-collector", updated_at: "2026-01-02T00:00:00Z" },
      ],
      new Set(),
    );
    const xml = renderUrlset("https://www.campusedux.com", entries);
    expect(xml).toContain("/learning/java-tutorial/garbage-collection</loc>");
    expect(xml).not.toContain("/learning/java-tutorial/garbage-collector");
  });

  it("redirected lessons are never offered as a related lesson", () => {
    const tree: LearningTree = {
      grid: { id: "g", name: "Java Tutorials", slug: "java-tutorial", description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null },
      sections: [
        {
          id: "s-mem",
          name: "Memory",
          slug: "s-mem",
          description: "",
          topics: [
            ["garbage-collection", "Garbage Collection"],
            ["garbage-collector", "Garbage Collector"],
            ["heap-and-stack", "Heap and Stack"],
          ].map(([slug, title]) => ({ id: slug, slug, title, short_description: "", is_premium: false })),
        },
      ],
    };
    const related = selectRelatedLessons(tree, "garbage-collection").map((l) => l.topicSlug);
    expect(related).toContain("heap-and-stack");
    expect(related).not.toContain("garbage-collector");
  });
});
