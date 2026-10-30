import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toOutline } from "@/lib/courseOutline";
import type { LearningTree } from "@/lib/learning.types";
import { databaseGroupName, DBMS_SQL_SLUG } from "@/lib/databaseTutorial";
import { TestAttemptReview } from "@/components/learning/TestAttemptReview";
import { LessonSidebar } from "@/app/learning/_components/LessonSidebar";
import { CourseCurriculum } from "@/app/learning/_components/CourseCurriculum";
import TopicPage, { generateMetadata } from "@/app/learning/[gridSlug]/[topicSlug]/page";

const reads = vi.hoisted(() => ({ tree: vi.fn(), page: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getLearningTree: reads.tree, getLearningTopicPage: reads.page }));
vi.mock("@/app/learning/[gridSlug]/[topicSlug]/_components/TopicPractice", () => ({ TopicPractice: () => null }));
vi.mock("@/app/learning/[gridSlug]/[topicSlug]/_components/TopicDiscovery", () => ({ TopicDiscovery: () => null }));
vi.mock("@/app/learning/[gridSlug]/[topicSlug]/_components/RelatedLessons", () => ({ RelatedLessons: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => { throw new Error("NOT_FOUND"); },
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));

const tree: LearningTree = {
  grid: { id: "dbms", name: "DBMS & SQL Tutorial", slug: DBMS_SQL_SLUG, description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null },
  sections: [
    { id: "keys", slug: "chapter-5-keys-and-integrity", name: "Chapter 5: Keys and Integrity", description: "", topics: [
      { id: "existing-id", slug: "primary-key", title: "Primary Key", short_description: "", is_premium: false },
    ] },
    { id: "empty", slug: "chapter-26-recovery-and-logging", name: "Chapter 26: Recovery and Logging", description: "", topics: [] },
  ],
};

beforeEach(() => {
  reads.tree.mockResolvedValue(tree);
  reads.page.mockResolvedValue({
    topic: { ...tree.sections[0].topics[0], updated_at: "2026-10-28T00:00:00Z" },
    grid: { name: tree.grid.name, slug: DBMS_SQL_SLUG },
    section: { name: tree.sections[0].name, slug: tree.sections[0].slug },
    locked: false, prev: null, next: null,
    contents: [{ id: "notes", heading: "How a primary key identifies a row", body: "A primary key uniquely identifies each row and cannot contain NULL.", content_format: "markdown", file_url: null, video_url: null, metadata: {} }],
  });
});

describe("DBMS/SQL topic route", () => {
  const params = { gridSlug: DBMS_SQL_SLUG, topicSlug: "primary-key" };
  it("returns not-found for a missing topic instead of redirecting it to the course", async () => {
    reads.page.mockResolvedValue(null);
    await expect(TopicPage({ params })).rejects.toThrow("NOT_FOUND");
  });

  it("serves readable notes, one H1, descriptive headings and the preserved canonical URL", async () => {
    const html = renderToStaticMarkup(await TopicPage({ params }));
    expect(html).toContain("A primary key uniquely identifies each row");
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).not.toContain("Chapter 5:");
    expect(html).not.toMatch(/Lesson \d+ of/);
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/learning/dbms-sql-tutorial/primary-key");
  });

  it("keeps an empty, unlocked topic unavailable and noindex", async () => {
    const page = await reads.page();
    reads.page.mockResolvedValue({ ...page, contents: [] });
    await expect(TopicPage({ params })).rejects.toThrow("NOT_FOUND");
    expect((await generateMetadata({ params })).robots).toMatchObject({ index: false });
  });
});

describe("DBMS/SQL navigation", () => {
  it("preserves topic identities and progress keys while omitting empty curriculum groups", () => {
    const outline = toOutline(tree);
    expect(outline.sections).toHaveLength(1);
    expect(outline.sections[0].name).toBe("Keys and Integrity");
    expect(outline.sections[0].lessons[0]).toMatchObject({ id: "existing-id", slug: "primary-key" });
    expect(outline.order).toEqual(["primary-key"]);
    expect(tree.sections[0].name).toBe("Chapter 5: Keys and Integrity");
  });

  it("leaves other courses' names and outlines intact", () => {
    const outline = toOutline({ ...tree, grid: { ...tree.grid, slug: "java" } });
    expect(outline.sections).toHaveLength(2);
    expect(outline.sections[0].name).toBe("Chapter 5: Keys and Integrity");
    expect(databaseGroupName(DBMS_SQL_SLUG, "Partitioning strategies")).toBe("Partitioning strategies");
  });

  it("renders descriptive, crawlable navigation without generic numbered headings", () => {
    const outline = toOutline(tree);
    const sidebar = renderToStaticMarkup(createElement(LessonSidebar, { outline, currentSlug: "primary-key" }));
    const curriculum = renderToStaticMarkup(createElement(CourseCurriculum, { outline, chapterTests: { keys: { id: "test", title: "Chapter 5 Test" } } }));
    for (const html of [sidebar, curriculum]) {
      expect(html).toContain("Keys and Integrity");
      expect(html).toContain('href="/learning/dbms-sql-tutorial/primary-key"');
      expect(html).not.toContain("Chapter 5");
      expect(html).not.toContain("Recovery and Logging");
    }
    expect(curriculum).toContain("Keys and Integrity review");
    expect(sidebar).toContain('aria-current="page"');
  });
});

describe("answer review rendering", () => {
  it("shows the authoritative score and distinguishes selected, correct and unanswered options without relying on color", () => {
    const html = renderToStaticMarkup(createElement(TestAttemptReview, { review: {
      attempt: { id: "a", test_id: "t", score: 0, total_marks: 2, correct_count: 0, incorrect_count: 1, time_taken_seconds: 10, created_at: "2026-10-28" },
      questions: [
        { id: "q1", question_text: "<script>sample</script>", options: ["A", "B", "C", "D"], correct_index: 1, explanation: "Because B matches the condition.", sort_order: 0 },
        { id: "q2", question_text: "Unanswered", options: ["A", "B", "C", "D"], correct_index: 0, explanation: "A is correct.", sort_order: 1 },
      ],
      answers: [{ question_id: "q1", selected_index: 0 }, { question_id: "q2", selected_index: null }],
    } }));
    expect(html).toContain("Score: 0 / 2");
    expect(html).toContain("A · Your answer");
    expect(html).toContain("B · Correct answer");
    expect(html).toContain("Not answered.");
    expect(html).toContain("Because B matches the condition.");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
