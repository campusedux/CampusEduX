import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, cloneElement, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "@/app/page";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { courseProgress, emptyState, recordVisit } from "@/lib/learningProgress/model";
import type { LearningGridCard } from "@/lib/learning.types";

const api = vi.hoisted(() => ({ session: vi.fn(), progress: vi.fn() }));
vi.mock("@/lib/useSessionProfile", () => ({ useSessionProfile: api.session }));
vi.mock("@/lib/learningProgress", () => ({ useLearningProgress: api.progress }));
vi.mock("@/lib/cache", () => ({
  getCachedHomeData: async () => ({
    trending: [], jobs: [], testimonials: [], faqs: [],
    banners: [{ id: "announcement", title: "Campus announcement", subtitle: "", image_url: null, target_url: "/projects", starts_at: null, ends_at: null }],
  }),
}));
vi.mock("@/lib/blog", () => ({ getLatestPosts: async () => [] }));
vi.mock("@/lib/learning", () => ({ getLearningGrids: async () => courses }));
vi.mock("@/lib/practice", () => ({ getPracticeCategories: async () => [] }));
vi.mock("@/lib/interviewQuestions", () => ({ getInterviewCategories: async () => [] }));

const courses: LearningGridCard[] = [{
  id: "java", slug: "java", name: "Java", description: "Learn Java.", icon: null, icon_url: null,
  cover_image_url: null, accent_color: null, is_featured: true, sort_order: 0, section_count: 1,
  topic_count: 5, grid_type: "content", is_premium: false,
}];
const features = [
  { label: "Learning", description: "Structured tutorials from basics to advanced — Java, Python, DBMS, AI/ML and more.", href: "/learning", cta: "Start learning" },
  { label: "Coding practice", description: "Solve problems in Java, Python, C, C++ or JavaScript with instant feedback.", href: "/practice", cta: "Practise now" },
  { label: "Jobs & internships", description: "Fresh roles for students and freshers — apply straight from the listing.", href: "/jobs", cta: "Find jobs" },
  { label: "Project marketplace", description: "Explore source-code examples with explanations, or share your own learning project.", href: "/projects", cta: "Browse projects" },
  { label: "Resume builder", description: "ATS-friendly templates, a score check and one-click PDF export.", href: "/resume", cta: "Build my resume" },
  { label: "Custom projects", description: "Get project mentoring or commission software for personal and business use.", href: "/custom-projects", cta: "Explore options" },
];

// Resolve async server children as in home-learning-ui.test.ts; Vitest has no Next RSC renderer.
async function serverChildren(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(Children.toArray(node).map(serverChildren));
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    return serverChildren(await (node.type as (props: unknown) => Promise<ReactNode>)(node.props));
  }
  return cloneElement(node, {}, await serverChildren(node.props.children));
}

beforeEach(() => {
  api.session.mockReturnValue({ loading: false, profile: null });
  const state = recordVisit(emptyState(), { gridSlug: "java", gridName: "Java", topicSlug: "intro", topicTitle: "Introduction" }, new Date("2026-11-01T10:00:00Z"));
  api.progress.mockReturnValue({
    ready: true, lastVisited: state.lastVisited, streak: { current: 0 }, week: [],
    today: { goal: 1, completedToday: 0, met: false },
    courseProgress: (slug: string, total: number) => courseProgress(state, slug, total),
  });
});

describe("Home What you get section", () => {
  it("renders the requested heading and description as a labelled section", () => {
    const html = renderToStaticMarkup(createElement(ModuleGrid));
    expect(html).toContain('aria-labelledby="home-features-title"');
    expect(html).toContain("WHAT YOU GET");
    expect(html).toContain('<h2 id="home-features-title"');
    expect(html).toContain("Everything you need, from first lesson to first offer");
    expect(html).toContain("One account for learning, practice, projects and your job search — on the web and the CampusEduX app.");
    expect(html).not.toContain("<h1");
  });

  it("makes all six complete cards native links to the existing destinations", () => {
    const html = renderToStaticMarkup(createElement(ModuleGrid));
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(links.map(link => link[1])).toEqual(features.map(feature => feature.href));
    features.forEach((feature, i) => {
      const card = links[i][2].replace(/&amp;/g, "&");
      expect(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1]).toBe(feature.label);
      expect(card).toContain(feature.description);
      expect(card).toContain(feature.cta);
      expect(card.match(/<svg\b/g)).toHaveLength(2);
      expect(card.match(/aria-hidden="true"/g)).toHaveLength(2);
      expect(card).not.toMatch(/<a\b|<button\b|tabindex=/i);
    });
  });

  it.each([false, true])("keeps one feature section before the other home sections with signedIn=%s", async signedIn => {
    if (signedIn) api.session.mockReturnValue({ loading: false, profile: { id: "student", fullName: "Test Student" } });
    const html = renderToStaticMarkup(await serverChildren(HomePage()) as ReactElement);
    const sections = [...html.matchAll(/<section\b[^>]*aria-(?:labelledby|label)="([^"]+)"/g)].map(match => match[1]);
    expect(sections.slice(0, signedIn ? 6 : 5)).toEqual([
      "home-hero-title",
      ...(signedIn ? ["continue-title"] : []),
      "home-features-title",
      "home-courses-title",
      "Announcement",
      "custom-project-promo-title",
    ]);
    expect(sections.filter(id => id === "home-features-title")).toHaveLength(1);
    if (signedIn) expect(html).toContain('href="/learning/java/intro"');
    else expect(sections).not.toContain("continue-title");
  });
});
