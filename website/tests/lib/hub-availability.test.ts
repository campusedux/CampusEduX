import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSitemapSupabase, loadSitemapRoutes, unloadSitemapRoutes } from "../helpers/sitemapFakes";

const api = vi.hoisted(() => ({ grids: vi.fn() }));
vi.mock("@/lib/learning", () => ({ getLearningGrids: api.grids }));
import LearningPage, { generateMetadata as learningMetadata } from "@/app/learning/page";

beforeEach(() => api.grids.mockResolvedValue([]));
afterEach(() => { unloadSitemapRoutes(); vi.restoreAllMocks(); });

describe("confirmed-empty hubs versus unavailable reads", () => {
  it("noindexes and omits Learning only after a confirmed empty read", async () => {
    expect((await learningMetadata({ searchParams: Promise.resolve({}) })).robots).toEqual({ index: false, follow: true });
    const routes = await loadSitemapRoutes(fakeSitemapSupabase());
    const response = await routes.sections.learning.GET();
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("/learning</loc>");
  });

  it.each([{}, { q: "java" }])("never adds Learning noindex after a failed read (%j)", async params => {
    api.grids.mockRejectedValue(new Error("synthetic timeout"));
    expect((await learningMetadata({ searchParams: Promise.resolve(params) })).robots).toBeUndefined();
    await expect(LearningPage({ searchParams: Promise.resolve(params) })).rejects.toThrow();
    const routes = await loadSitemapRoutes(fakeSitemapSupabase({ errors: ["learning_sitemap"] }));
    const response = await routes.sections.learning.GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain("<urlset");
  });

  it("omits confirmed-empty interview sections, and fails rather than dropping URLs on read error", async () => {
    let routes = await loadSitemapRoutes(fakeSitemapSupabase());
    expect(await routes.sectionXml("interview-questions")).not.toContain("/practice/interview-questions</loc>");
    routes = await loadSitemapRoutes(fakeSitemapSupabase({ errors: ["interview_questions_sitemap"] }));
    const response = await routes.sections["interview-questions"].GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await routes.index.GET()).status).toBe(503);
  });

  it("rejects failed question-presence checks rather than publishing a partial interview sitemap", async () => {
    const routes = await loadSitemapRoutes(fakeSitemapSupabase({
      rpcs: { interview_questions_sitemap: [{ category_slug: "java", topic_slug: "oop", updated_at: null }] },
      errors: ["interview_topic_detail"],
    }));
    expect((await routes.sections["interview-questions"].GET()).status).toBe(503);
  });
});
