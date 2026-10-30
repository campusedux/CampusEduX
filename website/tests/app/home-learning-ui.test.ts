import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, cloneElement, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePersonal } from "@/components/home/HomePersonal";
import { CourseCard } from "@/components/learning/CourseCard";
import { ContinueLearningRow } from "@/app/learning/_components/ContinueLearningRow";
import LearningIndexPage from "@/app/learning/page";
import type { LearningGridCard } from "@/lib/learning.types";
import { courseProgress, emptyState, markComplete, recordVisit, type LearningProgressState } from "@/lib/learningProgress/model";

const api = vi.hoisted(() => ({ grids: vi.fn(), search: vi.fn(), session: vi.fn(), progress: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getLearningGrids: api.grids, searchLearning: api.search }));
vi.mock("@/lib/useSessionProfile", () => ({ useSessionProfile: api.session }));
vi.mock("@/lib/learningProgress", () => ({ useLearningProgress: api.progress }));
// Editorial topic selection is independent of these four presentation components.
vi.mock("@/app/learning/_components/PopularTopics", () => ({ PopularTopics: () => null }));

function course(slug: string, overrides: Partial<LearningGridCard> = {}): LearningGridCard {
  return {
    id: slug, slug, name: `${slug} course`, description: "Original course description.", icon: null, icon_url: null,
    cover_image_url: null, accent_color: null, is_featured: false, sort_order: 0, section_count: 2,
    topic_count: 5, grid_type: "content", is_premium: false, ...overrides,
  };
}
const courses = [course("java", { is_featured: true }), course("python", { is_featured: true, is_premium: true }), course("sql")];
function progress(state: LearningProgressState, ready = true) {
  api.progress.mockReturnValue({ ready, courseProgress: (slug: string, total: number) => courseProgress(state, slug, total) });
}

// Resolve async server children at the test boundary; Vitest does not provide Next's RSC renderer.
async function serverChildren(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(Children.toArray(node).map(serverChildren));
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    const render = node.type as (props: unknown) => Promise<ReactNode>;
    return serverChildren(await render(node.props));
  }
  return cloneElement(node, {}, await serverChildren(node.props.children));
}
async function learning(searchParams: Parameters<typeof LearningIndexPage>[0]["searchParams"] = {}) {
  const node = await LearningIndexPage({ searchParams });
  return renderToStaticMarkup(await serverChildren(node) as ReactElement);
}
function section(html: string, id: string) {
  return html.match(new RegExp(`<section\\b[^>]*aria-labelledby="${id}"[\\s\\S]*?<\\/section>`))?.[0] ?? "";
}

beforeEach(() => {
  api.grids.mockResolvedValue(courses);
  api.search.mockResolvedValue([]);
  api.session.mockReturnValue({ loading: false, profile: null });
  progress(emptyState());
});

describe("Home hero presentation", () => {
  it("shows the compact headline, subtitle, and existing CTA destinations", () => {
    const html = renderToStaticMarkup(createElement(HomeHero, { stats: [], courses: [] }));
    expect(html).toContain("Learn skills. Build projects.");
    expect(html.replace(/<[^>]+>/g, "")).toContain("Land the job.");
    expect(html).toContain("Your next skill. Your next opportunity.");
    expect(html.match(/class="text-gradient"/g)).toHaveLength(1);
    expect(html).toContain('href="/learning"');
    expect(html).toContain("Start learning");
    expect(html).toContain('href="/jobs"');
    expect(html).toContain("Find jobs &amp; internships");
    expect((html.match(/<h1\b/g) ?? [])).toHaveLength(1);
  });

  it("renders only supplied positive statistics and preserves their real values", () => {
    const html = renderToStaticMarkup(createElement(HomeHero, { stats: [{ value: 12345, label: "lessons" }, { value: 0, label: "Unavailable stat" }], courses: [] }));
    expect(html).toContain("12,345");
    expect(html).toContain("lessons");
    expect(html).not.toContain("Unavailable stat");
    expect(html).not.toContain("testimonials");
  });

  it("uses header search and exposes four existing quick-access destinations", () => {
    const html = renderToStaticMarkup(createElement(HomeHero, { stats: [], courses: [] }));
    expect(html).not.toContain('role="search"');
    const nav = html.match(/<nav\b[\s\S]*?<\/nav>/)?.[0] ?? "";
    expect(nav).toContain("Quick access");
    expect([...nav.matchAll(/href="([^"]+)"/g)].map(match => match[1])).toEqual(["/learning", "/practice", "/projects", "/jobs"]);
  });

  it("does not invent a statistics block for an empty catalogue", () => {
    const html = renderToStaticMarkup(createElement(HomeHero, { stats: [{ value: 0, label: "courses" }], courses: [] }));
    expect(html).not.toContain("<dl");
  });
});

describe("Learning catalogue presentation", () => {
  it.each([undefined, "free", "premium"])("keeps one labelled native query and named submit with access=%s", async access => {
    const html = await learning({ q: "  java & sql  ", access });
    const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0] ?? "";
    expect(form).toContain('action="/learning" method="get" role="search"');
    expect((form.match(/type="search"/g) ?? [])).toHaveLength(1);
    expect(form).toContain("Search courses and lessons</span>");
    expect(form).toContain('name="q"');
    expect(form).toContain('value="java &amp; sql"');
    expect(form).toContain('placeholder="Search a topic, e.g. joins, loops, OOP…"');
    expect((form.match(/<button\b/g) ?? [])).toHaveLength(1);
    expect(form).toContain('type="submit" aria-label="Search"');
    expect((form.match(/name="access"/g) ?? [])).toHaveLength(access ? 1 : 0);
    if (access) expect(form).toContain(`type="hidden" name="access" value="${access}"`);
    expect(form).not.toMatch(/onSubmit|onClick/);
    expect(api.search).toHaveBeenCalledWith("java & sql", 30);
  });

  it.each([undefined, "free", "premium"])("clears only the search query with access=%s", async access => {
    const html = await learning({ q: "java & sql", access, source: "home & learning", tag: ["one", "two"], empty: "", missing: undefined });
    const href = html.match(/<a\b[^>]*href="([^"]+)"[^>]*>\s*Clear search\s*<\/a>/)?.[1].replace(/&amp;/g, "&");
    expect(href).toBeDefined();
    const url = new URL(href!, "https://example.test");
    expect(url.pathname).toBe("/learning");
    expect(url.searchParams.has("q")).toBe(false);
    expect(url.searchParams.get("access")).toBe(access ?? null);
    expect(url.searchParams.get("source")).toBe("home & learning");
    expect(url.searchParams.getAll("tag")).toEqual(["one", "two"]);
    expect(url.searchParams.get("empty")).toBe("");
    expect(url.searchParams.has("missing")).toBe(false);
    expect(api.search).toHaveBeenCalledWith("java & sql", 30);
  });

  it("clears to the bare learning route when no other parameters exist", async () => {
    const html = await learning({ q: "java" });
    expect(html).toMatch(/href="\/learning"[^>]*>\s*Clear search\s*<\/a>/);
  });

  it("retains real totals, existing course order, and conditional featured courses", async () => {
    const html = await learning();
    expect(html).toContain(">Learning</h1>");
    expect(html).toContain("3 courses · 15 lessons");
    const all = section(html, "all-courses-title");
    expect([...all.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]).filter(href => href.startsWith("/learning/"))).toEqual(["/learning/java", "/learning/python", "/learning/sql"]);
    const featured = section(html, "featured-title");
    expect(featured).toContain('href="/learning/java"');
    expect(featured).toContain('href="/learning/python"');
    expect(featured).not.toContain('href="/learning/sql"');
    expect(api.grids).toHaveBeenCalledTimes(1);
  });

  it("keeps premium filtering, search parameters, and filter destinations", async () => {
    const html = await learning({ q: "  java  ", access: "premium" });
    expect(html).toContain('action="/learning" method="get" role="search"');
    expect(html).toContain('type="hidden" name="access" value="premium"');
    expect(html).toContain('name="q"');
    expect(html).toContain('value="java"');
    expect(html).toContain('href="/learning?q=java&amp;access=free"');
    expect(html).toContain('href="/learning?q=java&amp;access=premium"');
    const all = section(html, "all-courses-title");
    expect(all).toContain('href="/learning/python"');
    expect(all).not.toContain('href="/learning/java"');
    expect(html).not.toContain('id="featured-title"');
    expect(api.search).toHaveBeenCalledWith("java", 30);
  });

  it("preserves course and lesson search results without changing snippets", async () => {
    api.search.mockResolvedValue([
      { kind: "grid", title: "Course result", grid_slug: "java", grid_name: "Java", topic_slug: null, section_name: null, is_premium: false, snippet: "Original course snippet." },
      { kind: "topic", title: "Lesson result", grid_slug: "java", grid_name: "Java", topic_slug: "loops", section_name: "Basics", is_premium: true, snippet: "Original lesson snippet." },
    ]);
    const html = await learning({ q: "loop" });
    const results = section(html, "search-results-title");
    expect(results).toContain('href="/learning/java"');
    expect(results).toContain('href="/learning/java/loops"');
    expect(results).toContain("Original course snippet.");
    expect(results).toContain("Original lesson snippet.");
    expect(api.search).toHaveBeenCalledWith("loop", 30);
  });

  it("keeps honest empty-catalogue and empty-search states", async () => {
    api.grids.mockResolvedValue([]);
    const empty = await learning();
    expect(empty).toContain("No courses yet");
    expect(empty).not.toContain("in-depth course");
    expect(empty).not.toContain('aria-label="Filter by access"');
    const search = await learning({ q: "unknown" });
    expect(search).toContain("No matches");
    expect(search).toContain("0 results");
  });
});

describe("CourseCard presentation", () => {
  it("keeps full authored text, metadata, and course navigation", () => {
    const name = "A long course title covering several closely related programming concepts";
    const description = "Original repeated description. Original repeated description.";
    const html = renderToStaticMarkup(createElement(CourseCard, { course: course("long-course", { name, description }), compactOnMobile: true }));
    expect(html).toContain(name);
    expect(html).toContain(description);
    expect(html).toContain('href="/learning/long-course"');
    expect(html).toContain("2 sections");
    expect(html).toContain("5 lessons");
    expect(html).toContain("Free");
  });

  it("preserves featured/premium labels and admin-supplied cover images", () => {
    const html = renderToStaticMarkup(createElement(CourseCard, { course: course("premium", { is_featured: true, is_premium: true, cover_image_url: "https://example.com/course.jpg" }) }));
    expect(html).toContain("Featured");
    expect(html).toContain("Premium");
    expect(html).toContain('src="https://example.com/course.jpg"');
  });

  it("keeps actual progress and zero-count metadata without inventing completion", () => {
    const html = renderToStaticMarkup(createElement(CourseCard, { course: course("empty", { section_count: 0, topic_count: 0 }) }));
    expect(html).toContain("0 lessons");
    expect(html).not.toContain("0 sections");
    expect(html).toContain("Start");
    expect(html).toContain('aria-valuenow="0"');
  });

  it("shows a percentage and Continue for real progress without nesting interactive elements", () => {
    const state = markComplete(emptyState(), { gridSlug: "java", gridName: "Java", topicSlug: "intro", topicTitle: "Introduction" }, new Date("2026-10-28T10:00:00Z"));
    progress(state);
    const html = renderToStaticMarkup(createElement(CourseCard, { course: courses[0] }));
    expect(html).toContain("20%");
    expect(html).toContain("Continue");
    expect(html).toContain('aria-valuenow="20"');
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).not.toContain("<button");
    expect(html).not.toContain(">Started<");
  });
});

describe("Continue learning presentation", () => {
  it("retains personalized activity and recommendations when the resume card is placed above", () => {
    const lesson = { gridSlug: "java", gridName: "Java", topicSlug: "intro", topicTitle: "Introduction" };
    const state = recordVisit(emptyState(), lesson, new Date("2026-10-28T10:00:00Z"));
    api.session.mockReturnValue({ loading: false, profile: { id: "test-student", fullName: "Test Student" } });
    api.progress.mockReturnValue({
      ready: true, lastVisited: state.lastVisited, streak: { current: 0 }, week: [],
      today: { goal: 1, completedToday: 0, met: false },
      courseProgress: (slug: string, total: number) => courseProgress(state, slug, total),
    });
    const html = renderToStaticMarkup(createElement(HomePersonal, { courses, jobs: [], showContinue: false }));
    expect(html).toContain("Welcome back, Test");
    expect(html).toContain("This week");
    expect(html).toContain("Latest jobs");
    expect(html).toContain("Recommended for you");
    expect(html).not.toContain("Continue learning");
    expect(html).not.toContain("Resume lesson");
    const defaultLayout = renderToStaticMarkup(createElement(HomePersonal, { courses, jobs: [] }));
    expect(defaultLayout).toContain('href="/learning/java/intro"');
    expect(defaultLayout).toContain("Resume lesson");
  });

  it.each(["loading", "signed out", "progress not ready", "nothing started"])("keeps the row hidden when %s", state => {
    api.session.mockReturnValue({ loading: state === "loading", profile: state === "signed out" ? null : { id: "test-student" } });
    progress(emptyState(), state !== "progress not ready");
    expect(renderToStaticMarkup(createElement(ContinueLearningRow, { courses }))).toBe("");
  });

  it("shows model-derived counts, percentages, and the existing resume destination", () => {
    api.session.mockReturnValue({ loading: false, profile: { id: "test-student" } });
    const lesson = { gridSlug: "java", gridName: "Java", topicSlug: "loops", topicTitle: "Original lesson title" };
    let state = markComplete(emptyState(), lesson, new Date("2026-10-28T10:00:00Z"));
    state = markComplete(state, { ...lesson, topicSlug: "arrays" }, new Date("2026-10-28T10:01:00Z"));
    state = recordVisit(state, lesson, new Date("2026-10-28T10:02:00Z"));
    progress(state);
    const html = renderToStaticMarkup(createElement(ContinueLearningRow, { courses }));
    expect(html).toContain('href="/learning/java/loops"');
    expect(html).toContain("Original lesson title");
    expect(html).toContain("2 of 5 lessons · 40%");
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain("Resume");
  });

  it("keeps the three most recently visited courses in the same order", () => {
    api.session.mockReturnValue({ loading: false, profile: { id: "test-student" } });
    let state = emptyState();
    const list = ["first", "second", "third", "fourth"].map(slug => course(slug));
    list.forEach((item, i) => { state = recordVisit(state, { gridSlug: item.slug, gridName: item.name, topicSlug: "intro", topicTitle: "Introduction" }, new Date(`2026-10-28T10:0${i}:00Z`)); });
    progress(state);
    const html = renderToStaticMarkup(createElement(ContinueLearningRow, { courses: list }));
    expect([...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1])).toEqual(["/learning/fourth/intro", "/learning/third/intro", "/learning/second/intro"]);
  });
});
