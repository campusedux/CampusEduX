import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeSitemapSupabase, loadSitemapRoutes, unloadSitemapRoutes } from "../helpers/sitemapFakes";
import { listingCanonical, normalizeSiteUrl } from "@/lib/seo";

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  cache: <T>(fn: T) => fn,
}));
vi.mock("@/lib/cache", () => ({
  getCachedProjectsPage: vi.fn(async () => ({ count: 60 })),
  getCachedJobsPage: vi.fn(async () => ({ count: 60 })),
}));
vi.mock("@/lib/blog", () => ({
  getBlogPage: vi.fn(async () => ({ posts: [{ id: "p1" }], total: 60 })),
  BLOG_PAGE_SIZE: 12,
}));
vi.mock("@/lib/practice", () => ({
  getPracticeProblemsPage: vi.fn(async () => ({ items: [{ id: "p1" }], total: 60 })),
}));

afterEach(() => { vi.clearAllMocks(); unloadSitemapRoutes(); });

describe("canonical origin", () => {
  it.each([undefined, "", "  ", "http://campusedux.com", "https://campusedux.com/", "https://www.campusedux.com/"])("normalizes %s to the brand origin", (value) => {
    expect(normalizeSiteUrl(value)).toBe("https://www.campusedux.com");
  });
  it("preserves explicitly configured development/preview origins", () => {
    expect(normalizeSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
    expect(normalizeSiteUrl("https://preview.example/")).toBe("https://preview.example");
  });
});

describe("listing canonicals", () => {
  it("folds page 1 into the hub and preserves existing facet policy", () => {
    expect(listingCanonical("/jobs", 1)).toBe("https://www.campusedux.com/jobs");
    expect(listingCanonical("/jobs", 2, true)).toBe("https://www.campusedux.com/jobs");
  });
  it.each(["projects", "jobs", "blog", "practice/problems"])("/%s page 2 self-canonicalizes without adding an index directive", async (path) => {
    const modules = {
      projects: () => import("@/app/projects/page"),
      jobs: () => import("@/app/jobs/page"),
      blog: () => import("@/app/blog/page"),
      "practice/problems": () => import("@/app/practice/problems/page"),
    };
    const { generateMetadata } = await modules[path as keyof typeof modules]();
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
    const canonicalPath = path;
    expect(metadata.alternates?.canonical).toBe(`https://www.campusedux.com/${canonicalPath}?page=2`);
    expect(metadata.robots).toBeUndefined();
  });
  it("retains noindex for an out-of-range marketplace page", async () => {
    const { generateMetadata } = await import("@/app/projects/page");
    expect((await generateMetadata({ searchParams: Promise.resolve({ page: "99" }) })).robots).toMatchObject({ index: false });
  });
  it("retains facet canonical consolidation", async () => {
    const { generateMetadata } = await import("@/app/jobs/page");
    expect((await generateMetadata({ searchParams: Promise.resolve({ page: "2", location: "Remote" }) })).alternates?.canonical).toBe("https://www.campusedux.com/jobs");
  });
  it("does not index empty blog or practice listings", async () => {
    const blog = await import("@/lib/blog");
    const practice = await import("@/lib/practice");
    vi.mocked(blog.getBlogPage).mockResolvedValueOnce({ posts: [], total: 0, missing: false });
    vi.mocked(practice.getPracticeProblemsPage).mockResolvedValueOnce({ items: [], total: 0 });
    const b = await import("@/app/blog/page");
    const p = await import("@/app/practice/problems/page");
    expect((await b.generateMetadata({ searchParams: Promise.resolve({}) })).robots).toMatchObject({ index: false });
    expect((await p.generateMetadata({ searchParams: Promise.resolve({}) })).robots).toMatchObject({ index: false });
  });
});

describe("sitemap RLS and quality parity", () => {
  it("omits genuinely empty listing hubs from the generated XML", async () => {
    const routes = await loadSitemapRoutes(fakeSitemapSupabase());
    expect(await routes.sectionXml("blog")).not.toContain("/blog</loc>");
    expect(await routes.sectionXml("problems")).not.toContain("/practice/problems</loc>");
  });

  it.each(["blog_posts", "practice_problems_sitemap"])("throws on %s failure rather than caching an empty sitemap", async (source) => {
    const routes = await loadSitemapRoutes(fakeSitemapSupabase({ errors: [source] }));
    await expect(routes.sections[source === "blog_posts" ? "blog" : "problems"].GET()).rejects.toThrow();
    await expect(routes.index.GET()).rejects.toThrow();
  });

  it("rejects a malformed sitemap RPC payload instead of publishing an empty hub", async () => {
    const routes = await loadSitemapRoutes(fakeSitemapSupabase({ rpcResults: { practice_problems_sitemap: null } }));
    await expect(routes.sections.problems.GET()).rejects.toThrow();
  });

  it("keeps visible premium teasers, excludes empty free lessons and respects the website RPC", async () => {
    const routes = await loadSitemapRoutes(fakeSitemapSupabase({
      rpcs: { learning_sitemap: [
        { grid_slug: "java", topic_slug: "premium", updated_at: null },
        { grid_slug: "java", topic_slug: "empty", updated_at: null },
        { grid_slug: "java", topic_slug: "free", updated_at: null },
      ] },
      tables: {
        learning_grids: [{ id: "g", slug: "java" }],
        learning_topics: [
          { id: "t1", grid_id: "g", slug: "premium", is_premium: true },
          { id: "t2", grid_id: "g", slug: "empty", is_premium: false },
          { id: "t3", grid_id: "g", slug: "free", is_premium: false },
          { id: "t4", grid_id: "g", slug: "mobile-only", is_premium: true },
        ],
        learning_contents: [{ id: "c", topic_id: "t3" }],
      },
    }));
    const xml = await routes.sectionXml("learning");
    expect(xml).toContain("/learning/java/premium</loc>");
    expect(xml).toContain("/learning/java/free</loc>");
    expect(xml).not.toContain("/learning/java/empty</loc>");
    expect(xml).not.toContain("mobile-only");
  });
  it("fails rather than caching a sitemap after a content-presence lookup fails", async () => {
    const routes = await loadSitemapRoutes(fakeSitemapSupabase({ errors: ["learning_contents"] }));
    await expect(routes.sections.learning.GET()).rejects.toThrow();
  });
});
