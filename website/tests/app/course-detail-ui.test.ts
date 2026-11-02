import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CoursePage from "@/app/learning/[gridSlug]/page";
import { CourseHero } from "@/app/learning/_components/CourseHero";
import { CourseCurriculum } from "@/app/learning/_components/CourseCurriculum";
import { CourseCta } from "@/app/learning/_components/CourseCta";
import { toOutline } from "@/lib/courseOutline";
import type { LearningGridBrief, LearningTree } from "@/lib/learning.types";
import {
  courseProgress, emptyState, firstIncomplete, markComplete, recordVisit,
  type LearningProgressState, type LessonRef,
} from "@/lib/learningProgress/model";

const api = vi.hoisted(() => ({ tree: vi.fn(), brief: vi.fn(), tests: vi.fn(), slugs: vi.fn(), progress: vi.fn(), bookmarks: vi.fn(), reconcile: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getLearningTree: api.tree, getLearningGridBrief: api.brief, getGridScopedTests: api.tests, getLearningGridSlugs: api.slugs }));
vi.mock("@/lib/learningProgress", () => ({ useLearningProgress: api.progress }));
vi.mock("@/lib/useLearningBookmarks", () => ({ useLearningBookmarks: api.bookmarks }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));

const description = "Original course description. Original course description repeated in full.";
const brief: LearningGridBrief = { id: "java", slug: "java", name: "Java programming", description, grid_type: "content", is_premium: false, icon: null, cover_image_url: null, accent_color: null };
const tree: LearningTree = {
  grid: { id: "java", slug: "java", name: brief.name, description, icon: null, icon_url: null, cover_image_url: null, accent_color: null },
  sections: [
    { id: "basics", slug: "basics", name: "Language fundamentals", description: "", topics: [
      { id: "intro", slug: "intro", title: "Introduction", short_description: "", is_premium: false },
      { id: "loops", slug: "loops", title: "Long lesson title about iteration, nested loops, and practical examples", short_description: "", is_premium: true },
    ] },
    { id: "advanced", slug: "advanced", name: "Advanced concepts with a long descriptive section title", description: "", topics: Array.from({ length: 7 }, (_, i) => ({ id: `topic-${i + 3}`, slug: `lesson-${i + 3}`, title: `Lesson ${i + 3}`, short_description: "", is_premium: false })) },
  ],
};
const outline = toOutline(tree);
const chapterTests = { basics: { id: "chapter-test", title: "Original chapter assessment title" } };
const courseTest = { id: "course-test", title: "Original course assessment title" };
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
const ref = (slug: string): LessonRef => ({ gridSlug: "java", gridName: brief.name, topicSlug: slug, topicTitle: slug === "intro" ? "Introduction" : "Original lesson title" });

function progress(state: LearningProgressState, ready = true) {
  api.progress.mockReturnValue({
    ready, state,
    courseProgress: (slug: string, total: number) => courseProgress(state, slug, total),
    isComplete: (grid: string, slug: string) => Boolean(state.courses[grid]?.completed[slug]),
    firstIncomplete: (grid: string, order: string[]) => firstIncomplete(state, grid, order),
    reconcileCourse: api.reconcile,
  });
}
const renderCta = () => renderToStaticMarkup(createElement(CourseCta, { outline, courseTest }));

beforeEach(() => {
  api.tree.mockResolvedValue(tree);
  api.brief.mockResolvedValue(brief);
  api.tests.mockResolvedValue({ courseTest, chapterTestBySectionId: chapterTests });
  api.slugs.mockResolvedValue(["java"]);
  api.bookmarks.mockReturnValue(new Set());
  progress(emptyState());
});

describe("course hero presentation", () => {
  it("keeps the full title, description, real counts, and authored outcomes", () => {
    const html = renderToStaticMarkup(createElement(CourseHero, { brief, outline, description, coverImageUrl: null, testCount: 2 }));
    expect(html).toContain(brief.name);
    expect(html).toContain(description);
    expect(plain(html)).toContain("2 sections");
    expect(plain(html)).toContain("9 lessons");
    expect(plain(html)).toContain("2 practice tests");
    expect(plain(html)).toContain("1 premium lesson");
    expect(html).toContain("Free course");
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    for (const section of outline.sections) expect(html).toContain(section.name);
    expect((html.match(/<h1\b/g) ?? [])).toHaveLength(1);
  });

  it("keeps premium-course labels without fabricating practice tests", () => {
    const html = renderToStaticMarkup(createElement(CourseHero, { brief: { ...brief, is_premium: true }, outline, description, coverImageUrl: "https://example.com/course.jpg", testCount: 0 }));
    expect(html).toContain("Premium course");
    expect(html).not.toContain("Free course");
    expect(html).not.toContain("practice test");
    expect(html).toContain('src="https://example.com/course.jpg"');
    expect(html).toContain(description);
  });

  it("preserves the existing eight-outcome limit and remaining-section count", () => {
    const large = { ...outline, sections: Array.from({ length: 10 }, (_, i) => ({ ...outline.sections[0], id: `section-${i}`, name: `Outcome ${i + 1}` })) };
    const html = renderToStaticMarkup(createElement(CourseHero, { brief, outline: large, description, coverImageUrl: null, testCount: 0 }));
    expect(html).toContain("Outcome 8");
    expect(html).not.toContain("Outcome 9");
    expect(plain(html)).toContain("+ 2 more sections in the curriculum below");
  });
});

describe("curriculum presentation", () => {
  it("retains every lesson destination, full titles, and chapter assessment", () => {
    const html = renderToStaticMarkup(createElement(CourseCurriculum, { outline, chapterTests }));
    for (const slug of outline.order) expect(html).toContain(`href="/learning/java/${slug}"`);
    expect(html).toContain(tree.sections[0].topics[1].title);
    expect(html).toContain(outline.sections[1].name);
    expect(html).toContain('href="/mock-tests/chapter-test"');
    expect(html).toContain(chapterTests.basics.title);
    expect(html).toContain('aria-label="Search lessons in this course"');
    expect(html).toContain("Expand all");
    expect(html).toContain("Premium");
    expect(html).not.toContain('aria-label="Completed"');
  });

  it("retains completion and bookmark markers derived from existing state", () => {
    progress(markComplete(emptyState(), ref("intro"), new Date("2026-10-28T12:00:00Z")));
    api.bookmarks.mockReturnValue(new Set(["loops"]));
    const html = renderToStaticMarkup(createElement(CourseCurriculum, { outline, chapterTests }));
    expect(html).toContain('aria-label="Completed"');
    expect(html).toContain('aria-label="Bookmarked"');
    expect(html).toContain("1/2 done");
    expect(html).toContain("Premium");
    expect(html).toContain('href="/learning/java/loops"');
  });

  it("keeps empty sections honest and hides search for a short curriculum", () => {
    const short = { ...outline, sections: [{ id: "empty", name: "Empty section", lessons: [] }], order: [], total: 0 };
    const html = renderToStaticMarkup(createElement(CourseCurriculum, { outline: short, chapterTests: {} }));
    expect(html).toContain("No lessons published yet.");
    expect(html).not.toContain('type="search"');
    expect(html).not.toContain("Expand all");
  });
});

describe("course CTA presentation", () => {
  it("keeps the initial Start course destination before progress is ready", () => {
    progress(emptyState(), false);
    const html = renderCta();
    expect((html.match(/href="\/learning\/java\/intro"/g) ?? [])).toHaveLength(2);
    expect(html).toContain("Start course");
    expect(html).toContain("Saved on this device");
    expect(html).toContain('href="/mock-tests/course-test"');
    expect(html).toContain(courseTest.title);
  });

  it("resumes the existing last-visited lesson and displays model-derived progress", () => {
    let state = markComplete(emptyState(), ref("intro"), new Date("2026-10-28T12:00:00Z"));
    state = recordVisit(state, ref("loops"), new Date("2026-10-28T12:01:00Z"));
    progress(state);
    const html = renderCta();
    expect((html.match(/href="\/learning\/java\/loops"/g) ?? [])).toHaveLength(2);
    expect(html).toContain("Continue");
    expect(plain(html)).toContain("1/9 lessons · 11%");
    expect(html).toContain('aria-valuenow="11"');
  });

  it("keeps the first-incomplete fallback when the visited lesson was removed", () => {
    let state = markComplete(emptyState(), ref("intro"), new Date("2026-10-28T12:00:00Z"));
    state = recordVisit(state, ref("removed"), new Date("2026-10-28T12:01:00Z"));
    progress(state);
    const html = renderCta();
    expect((html.match(/href="\/learning\/java\/loops"/g) ?? [])).toHaveLength(2);
    expect(html).not.toContain('href="/learning/java/removed"');
  });

  it("keeps completed courses pointing to the first lesson for review", () => {
    let state = emptyState();
    for (const slug of outline.order) state = markComplete(state, ref(slug), new Date("2026-10-28T12:00:00Z"));
    progress(state);
    const html = renderCta();
    expect((html.match(/href="\/learning\/java\/intro"/g) ?? [])).toHaveLength(2);
    expect(html).toContain("Review course");
    expect(html).toContain("Course complete");
    expect(html).toContain('aria-valuenow="100"');
  });

  it("keeps saved lesson destinations and the existing six-item limit", () => {
    api.bookmarks.mockReturnValue(new Set(outline.sections.flatMap(section => section.lessons.map(lesson => lesson.id))));
    const html = renderCta();
    const saved = html.match(/<ul\b[\s\S]*?<\/ul>/)?.[0] ?? "";
    expect((saved.match(/<a\b/g) ?? [])).toHaveLength(6);
    expect(saved).toContain(tree.sections[0].topics[1].title);
    expect(saved).not.toContain('href="/learning/java/lesson-9"');
  });

  it("keeps the CTA absent when there are no published lessons", () => {
    expect(renderToStaticMarkup(createElement(CourseCta, { outline: { ...outline, sections: [], order: [], total: 0 }, courseTest: null }))).toBe("");
  });
});

describe("course detail page composition", () => {
  it("retains the real course description, curriculum, and assessment contracts", async () => {
    const html = renderToStaticMarkup(await CoursePage({ params: Promise.resolve({ gridSlug: "java" }) }));
    expect(html).toContain(description);
    expect(html).toContain('id="curriculum-title"');
    expect(html).toContain('href="/learning/java/intro"');
    expect(html).toContain('href="/mock-tests/chapter-test"');
    expect(html).toContain('href="/mock-tests/course-test"');
    expect(api.brief).toHaveBeenCalledWith("java");
    expect(api.tree).toHaveBeenCalledWith("java");
    expect(api.tests).toHaveBeenCalledWith("java");
  });

  it.each(["brief", "tree"] as const)("keeps missing %s records unavailable", async missing => {
    api[missing].mockResolvedValue(null);
    await expect(CoursePage({ params: Promise.resolve({ gridSlug: "java" }) })).rejects.toThrow("NOT_FOUND");
  });
});
