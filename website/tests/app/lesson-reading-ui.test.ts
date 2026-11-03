import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LearningTopicPage, LearningTree } from "@/lib/learning.types";
import { toOutline } from "@/lib/courseOutline";
import { LessonSidebar } from "@/app/learning/_components/LessonSidebar";
import TopicPage from "@/app/learning/[gridSlug]/[topicSlug]/page";

const api = vi.hoisted(() => ({ tree: vi.fn(), page: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getLearningTree: api.tree, getLearningTopicPage: api.page }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => { throw new Error("NOT_FOUND"); },
  redirect: (href: string) => { throw new Error(`REDIRECT:${href}`); },
}));
// These independent async discovery sections do not own the lesson reading UI.
vi.mock("@/app/learning/[gridSlug]/[topicSlug]/_components/TopicPractice", () => ({ TopicPractice: () => null }));
vi.mock("@/app/learning/[gridSlug]/[topicSlug]/_components/TopicDiscovery", () => ({ TopicDiscovery: () => null }));
vi.mock("@/app/learning/[gridSlug]/[topicSlug]/_components/RelatedLessons", () => ({ RelatedLessons: () => null }));

const topic = {
  id: "lesson-2", slug: "loops", title: "Loops and iteration", short_description: "The original lesson description.",
  is_premium: false, updated_at: "2026-10-28T00:00:00Z",
};
const tree: LearningTree = {
  grid: { id: "course", slug: "java", name: "Java", description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null },
  sections: [{
    id: "basics", name: "Basics", slug: "basics", description: "",
    topics: [
      { ...topic, id: "lesson-1", slug: "intro", title: "Introduction" },
      topic,
      { ...topic, id: "lesson-3", slug: "classes", title: "Classes", is_premium: true },
    ],
  }],
};
const originalBody = "Original educational text.\n\n```java\nSystem.out.println(42);\n```\n\n| Name | Value |\n| --- | --- |\n| limit | 42 |";
const lesson: LearningTopicPage = {
  topic, grid: { name: "Java", slug: "java" }, section: { name: "Basics", slug: "basics" }, locked: false,
  contents: [{ id: "block", heading: "Iteration examples", body: originalBody, content_format: "markdown", file_url: "https://example.com/notes.pdf", video_url: "https://example.com/video", metadata: {} }],
  prev: { slug: "intro", title: "Introduction" }, next: { slug: "classes", title: "Classes" },
};
async function render() {
  return renderToStaticMarkup(await TopicPage({ params: Promise.resolve({ gridSlug: "java", topicSlug: "loops" }) }));
}

beforeEach(() => {
  api.tree.mockResolvedValue(tree);
  api.page.mockResolvedValue(lesson);
});

describe("lesson reading presentation preserves its contracts", () => {
  it("keeps authored text, heading anchors, code, tables, and attachments", async () => {
    const html = await render();
    expect(html).toContain("The original lesson description.");
    expect(html).toContain("Original educational text.");
    expect(html).toContain('id="iteration-examples"');
    expect(html).toContain("System.out.println(42);");
    expect(html).toContain("<table");
    expect(html).toContain('href="https://example.com/notes.pdf"');
    expect(html).toContain('href="https://example.com/video"');
    expect((html.match(/<h1\b/g) ?? [])).toHaveLength(1);
  });

  it.each(["#", "##", "###"])("starts an untitled %s block at H2 beneath the lesson H1", async marker => {
    api.page.mockResolvedValue({ ...lesson, contents: [{ ...lesson.contents[0], heading: "", body: `${marker} First section\n\nOriginal text.` }] });
    const html = await render();
    expect(html).toMatch(/<h2[^>]*id="first-section"/);
    expect(html).not.toMatch(/<h3[^>]*id="first-section"/);
  });

  it("places authored H3 sections directly below the block H2", async () => {
    api.page.mockResolvedValue({ ...lesson, contents: [{ ...lesson.contents[0], body: "### Definition\n\nOriginal text.\n\n#### Detail\n\nMore text." }] });
    const html = await render();
    expect(html).toMatch(/<h3[^>]*id="definition"/);
    expect(html).toMatch(/<h4[^>]*id="detail"/);
  });

  it("exposes course navigation, real lesson position, and a named action group", async () => {
    const html = await render();
    expect(html).toContain("Back to course: ");
    expect(html).toContain('href="/learning/java"');
    expect(html).toContain('aria-label="Course contents" aria-haspopup="dialog" aria-expanded="false"');
    expect(html).toContain("Lesson 2 of 3");
    expect(html).toContain('role="group" aria-label="Lesson actions"');
    expect(html).toContain('aria-label="Lesson navigation"');
    expect(html).toContain('href="/learning/java/intro"');
    expect(html).toContain('href="/learning/java/classes"');
  });

  it("preserves repeated educational text and long section headings", async () => {
    const heading = "Understanding long section titles with multiple concepts and examples";
    const sentence = "Keep this repeated educational sentence exactly as authored.";
    api.page.mockResolvedValue({
      ...lesson,
      contents: [{ ...lesson.contents[0], heading, body: `${sentence}\n\n${sentence}\n\n## Another detailed section title\n\nMore original text.` }],
    });
    const html = await render();
    const article = html.match(/<article\b[\s\S]*?<\/article>/)?.[0] ?? "";
    expect(article).toContain(heading);
    expect(article.split(sentence)).toHaveLength(3);
    expect(article).toContain("Another detailed section title");
    expect(article).toContain("More original text.");
  });

  it("preserves code whitespace and the Copy, Run, and Open controls", async () => {
    const code = "console.log(42);\n  console.log(43);";
    api.page.mockResolvedValue({
      ...lesson,
      contents: [{ ...lesson.contents[0], body: `\`\`\`javascript\n${code}\n\`\`\`` }],
    });
    const html = await render();
    expect(html.match(/<code class="font-mono">([\s\S]*?)<\/code>/)?.[1]).toBe(code);
    for (const name of ["Copy code", "Run this code in the CampusEduX compiler", "Open this code in the CampusEduX compiler"]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
  });

  it("does not expose withheld content or completion actions for a locked lesson", async () => {
    api.page.mockResolvedValue({ ...lesson, locked: true, topic: { ...topic, is_premium: true }, contents: [{ ...lesson.contents[0], body: "WITHHELD_CONTENT_SENTINEL" }] });
    const html = await render();
    expect(html).not.toContain("WITHHELD_CONTENT_SENTINEL");
    expect(html).not.toContain("Mark as complete");
    expect(html).not.toContain("min read");
    expect(html).toContain("This is a premium lesson");
    expect(html).toContain('href="/premium"');
  });

  it("keeps first/last lesson navigation destinations without fabricating neighbors", async () => {
    api.page.mockResolvedValue({ ...lesson, prev: null, next: null });
    const html = await render();
    const nav = html.match(/<nav\b[^>]*aria-label="Lesson navigation"[\s\S]*?<\/nav>/)?.[0] ?? "";
    expect(nav).toContain('aria-label="Lesson navigation"');
    expect(nav).not.toContain("href=");
  });

  it("keeps the course fallback when a lesson was removed", async () => {
    api.page.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("REDIRECT:/learning/java");
  });

  it("keeps missing courses and unpublished empty lessons unavailable", async () => {
    api.tree.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("NOT_FOUND");
    api.tree.mockResolvedValue(tree);
    api.page.mockResolvedValue({ ...lesson, contents: [] });
    await expect(render()).rejects.toThrow("NOT_FOUND");
  });

  it("keeps active lesson, premium markers, and every syllabus destination", () => {
    const html = renderToStaticMarkup(createElement(LessonSidebar, { outline: toOutline(tree), currentSlug: "loops" }));
    for (const slug of ["intro", "loops", "classes"]) expect(html).toContain(`href="/learning/java/${slug}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Premium"');
    expect(html).toContain("3 lessons");
    expect(html).not.toContain("lessons done");
  });
});
