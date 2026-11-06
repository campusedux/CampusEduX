import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  absoluteSitemapUrl,
  buildBlogEntries,
  buildInterviewEntries,
  buildJobEntries,
  buildLearningEntries,
  buildProblemEntries,
  buildProjectEntries,
  buildStaticEntries,
  escapeXml,
  maxLastmod,
  renderSitemapIndex,
  renderUrlset,
  SITEMAP_EXCLUDED_PATHS,
  STATIC_SITEMAP_PATHS,
  toLastmod,
} from "@/lib/sitemap/build";
import {
  fakeSitemapSupabase,
  loadSitemapRoutes,
  locs,
  SITEMAP_SECTION_NAMES,
  unloadSitemapRoutes,
  urlEntries,
} from "../helpers/sitemapFakes";

const SITE = "https://www.campusedux.com";
const GENAI_TEMPLATE =
  "The important lesson is that the technique is a component of a larger system. Suppose a student is building an AI learning assistant.";

afterEach(() => {
  unloadSitemapRoutes();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
describe("sitemap dates", () => {
  it("toLastmod keeps a real timestamp and drops missing / invalid ones", () => {
    expect(toLastmod("2026-01-02T03:04:05Z")).toBe("2026-01-02T03:04:05.000Z");
    expect(toLastmod(null)).toBeUndefined();
    expect(toLastmod(undefined)).toBeUndefined();
    expect(toLastmod("")).toBeUndefined();
    expect(toLastmod("not a date")).toBeUndefined();
    expect(toLastmod(42)).toBeUndefined();
  });

  it("maxLastmod returns the newest valid date, or undefined when there is none", () => {
    expect(maxLastmod(["2026-01-01T00:00:00Z", null, "2026-03-01T00:00:00Z", "bad"])).toBe("2026-03-01T00:00:00.000Z");
    expect(maxLastmod([])).toBeUndefined();
    expect(maxLastmod([null, "bad"])).toBeUndefined();
  });
});

describe("sitemap XML", () => {
  it("home is the bare origin (same form as its canonical); other paths are appended", () => {
    expect(absoluteSitemapUrl(SITE, "/")).toBe(SITE);
    expect(absoluteSitemapUrl(`${SITE}/`, "/")).toBe(SITE);
    expect(absoluteSitemapUrl(`${SITE}/`, "/learning")).toBe(`${SITE}/learning`);
  });

  it("escapes XML special characters", () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe("a&amp;b&lt;c&gt;&quot;d&apos;");
  });

  it("renders a urlset, omitting <lastmod> when there is no real date and de-duplicating paths", () => {
    const xml = renderUrlset(SITE, [
      { path: "/about" },
      { path: "/blog/x", lastModified: "2026-01-01T00:00:00.000Z" },
      { path: "/about", lastModified: "2026-02-02T00:00:00.000Z" },
    ]);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(urlEntries(xml)).toEqual([
      { loc: `${SITE}/about` },
      { loc: `${SITE}/blog/x`, lastmod: "2026-01-01T00:00:00.000Z" },
    ]);
  });

  it("renders a sitemapindex", () => {
    const xml = renderSitemapIndex(SITE, [{ path: "/sitemaps/static.xml" }, { path: "/sitemaps/blog.xml", lastModified: "2026-01-01T00:00:00.000Z" }]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(urlEntries(xml)).toEqual([
      { loc: `${SITE}/sitemaps/static.xml` },
      { loc: `${SITE}/sitemaps/blog.xml`, lastmod: "2026-01-01T00:00:00.000Z" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------
describe("static section", () => {
  it("lists public legal pages and excludes the conditional referral page", () => {
    const paths = buildStaticEntries({ hasActiveFaqs: true, hasPremiumPlans: true }).map((e) => e.path);
    for (const p of ["/referral"]) {
      expect(SITEMAP_EXCLUDED_PATHS).toContain(p);
      expect(paths).not.toContain(p);
    }
    expect(paths).toContain("/");
    expect(paths).toContain("/compiler");
    expect(paths).toContain("/privacy-policy");
    for (const path of ["/delete-account", "/cookie-policy", "/refund-policy", "/data-and-permissions"]) expect(paths).toContain(path);
  });

  it("has no lastmod at all (no real content date for these pages)", () => {
    expect(buildStaticEntries({ hasActiveFaqs: true, hasPremiumPlans: true }).every((e) => e.lastModified === undefined)).toBe(true);
  });

  it("lists /faq and /premium only when the data their page needs to be indexable exists", () => {
    const off = buildStaticEntries({ hasActiveFaqs: false, hasPremiumPlans: false }).map((e) => e.path);
    expect(off).not.toContain("/faq");
    expect(off).not.toContain("/premium");
    const on = buildStaticEntries({ hasActiveFaqs: true, hasPremiumPlans: true }).map((e) => e.path);
    expect(on).toContain("/faq");
    expect(on).toContain("/premium");
    expect(on.length).toBe(STATIC_SITEMAP_PATHS.length);
  });

  it("no hub that carries a data-derived lastmod is duplicated into the static list", () => {
    for (const hub of ["/learning", "/blog", "/jobs", "/projects", "/practice", "/practice/problems", "/practice/interview-questions"]) {
      expect(STATIC_SITEMAP_PATHS as readonly string[]).not.toContain(hub);
    }
  });
});

describe("learning section", () => {
  const rows = [
    { grid_slug: "java-tutorial", topic_slug: null, updated_at: "2026-01-01T00:00:00Z" },
    { grid_slug: "java-tutorial", topic_slug: "intro", updated_at: "2026-02-01T00:00:00Z" },
    { grid_slug: "java-tutorial", topic_slug: "loops", updated_at: "2026-03-01T00:00:00Z" },
    { grid_slug: "generative-ai", topic_slug: null, updated_at: "2026-01-05T00:00:00Z" },
    { grid_slug: "generative-ai", topic_slug: "templated", updated_at: "2026-04-01T00:00:00Z" },
    { grid_slug: "generative-ai", topic_slug: "course-summary", updated_at: "2026-01-10T00:00:00Z" },
    { grid_slug: "spring-boot-tutorial", topic_slug: null, updated_at: "2026-05-01T00:00:00Z" },
    { grid_slug: "spring-boot-tutorial", topic_slug: "templated", updated_at: "2026-05-02T00:00:00Z" },
  ];
  const entries = buildLearningEntries(rows, new Set(["templated"]));
  const byPath = new Map(entries.map((e) => [e.path, e.lastModified]));

  it("lists the hub, every grid and every non-thin topic", () => {
    expect([...byPath.keys()]).toEqual([
      "/learning",
      "/learning/java-tutorial",
      "/learning/generative-ai",
      "/learning/spring-boot-tutorial",
      "/learning/java-tutorial/intro",
      "/learning/java-tutorial/loops",
      "/learning/generative-ai/course-summary",
      "/learning/spring-boot-tutorial/templated",
    ]);
  });

  it("excludes templated Generative-AI topics only inside the generative-ai grid", () => {
    expect(byPath.has("/learning/generative-ai/templated")).toBe(false);
    expect(byPath.has("/learning/spring-boot-tutorial/templated")).toBe(true);
  });

  it("topic lastmod = its own updated_at; grid lastmod = newest of the grid and ALL its topics; hub = newest overall", () => {
    expect(byPath.get("/learning/java-tutorial/intro")).toBe("2026-02-01T00:00:00.000Z");
    expect(byPath.get("/learning/java-tutorial")).toBe("2026-03-01T00:00:00.000Z");
    // the (noindexed) templated topic still counts: the grid page lists it
    expect(byPath.get("/learning/generative-ai")).toBe("2026-04-01T00:00:00.000Z");
    expect(byPath.get("/learning")).toBe("2026-05-02T00:00:00.000Z");
  });
});

describe("problems section", () => {
  it("lists practice hubs + problems and topic coding problems, minus thin coding problems", () => {
    const entries = buildProblemEntries(
      [
        { slug: "two-sum", updated_at: "2026-01-01T00:00:00Z" },
        { slug: "thin-one", updated_at: "2026-01-02T00:00:00Z" },
      ],
      new Set(["thin-one"]),
      [
        { slug: "activity-selection", updated_at: "2026-02-01T00:00:00Z" },
        { slug: "knapsack", updated_at: "2026-03-01T00:00:00Z" },
      ],
    );
    expect(entries).toEqual([
      { path: "/practice" },
      { path: "/practice/problems", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/practice/problems/activity-selection", lastModified: "2026-02-01T00:00:00.000Z" },
      { path: "/practice/problems/knapsack", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/coding-problems/two-sum", lastModified: "2026-01-01T00:00:00.000Z" },
    ]);
  });
});

describe("interview-questions section", () => {
  it("derives every category page that has a visible topic (not just java), with lastmod = newest topic", () => {
    const entries = buildInterviewEntries([
      { category_slug: "java", topic_slug: "oop", updated_at: "2026-01-01T00:00:00Z" },
      { category_slug: "java", topic_slug: "jvm", updated_at: "2026-02-01T00:00:00Z" },
      { category_slug: "python", topic_slug: "basics", updated_at: "2026-03-01T00:00:00Z" },
    ]);
    expect(entries).toEqual([
      { path: "/practice/interview-questions", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/practice/interview-questions/java", lastModified: "2026-02-01T00:00:00.000Z" },
      { path: "/practice/interview-questions/python", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/practice/interview-questions/java/oop", lastModified: "2026-01-01T00:00:00.000Z" },
      { path: "/practice/interview-questions/java/jvm", lastModified: "2026-02-01T00:00:00.000Z" },
      { path: "/practice/interview-questions/python/basics", lastModified: "2026-03-01T00:00:00.000Z" },
    ]);
  });
});

describe("jobs section", () => {
  it("drops the hubs and every company page when there is no open job", () => {
    expect(buildJobEntries([], [{ id: "microsoft", updated_at: "2026-01-01T00:00:00Z" }])).toEqual([]);
  });

  it("lists open jobs and only companies that have one; company lastmod includes its jobs", () => {
    const entries = buildJobEntries(
      [{ id: "j1", company_id: "tcs", updated_at: "2026-03-01T00:00:00Z" }],
      [
        { id: "tcs", updated_at: "2026-01-01T00:00:00Z" },
        { id: "microsoft", updated_at: "2026-05-01T00:00:00Z" },
      ],
    );
    expect(entries).toEqual([
      { path: "/jobs", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/jobs/companies", lastModified: "2026-01-01T00:00:00.000Z" },
      { path: "/jobs/j1", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/jobs/companies/tcs", lastModified: "2026-03-01T00:00:00.000Z" },
    ]);
  });
});

describe("projects section", () => {
  it("drops the hubs and every (noindexed) empty category page when there are no projects", () => {
    expect(buildProjectEntries([], [{ id: "web-development", updated_at: "2026-01-01T00:00:00Z" }])).toEqual([]);
  });

  it("lists projects, hubs and only non-empty categories, URL-encoding ids", () => {
    const entries = buildProjectEntries(
      [
        { id: "p 1", category_id: "web & mobile", updated_at: "2026-02-01T00:00:00Z" },
        { id: "p2", category_id: null, updated_at: "2026-03-01T00:00:00Z" },
      ],
      [
        { id: "web & mobile", updated_at: "2026-04-01T00:00:00Z" },
        { id: "devops", updated_at: "2026-01-01T00:00:00Z" },
      ],
    );
    expect(entries).toEqual([
      { path: "/projects", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/projects/trending" },
      { path: "/projects/p%201", lastModified: "2026-02-01T00:00:00.000Z" },
      { path: "/projects/p2", lastModified: "2026-03-01T00:00:00.000Z" },
      { path: "/projects/category/web%20%26%20mobile", lastModified: "2026-04-01T00:00:00.000Z" },
    ]);
  });
});

describe("blog section", () => {
  it("lists self-canonical posts and leaves out a post whose canonical points elsewhere", () => {
    const entries = buildBlogEntries(
      [
        { slug: "a", updated_at: "2026-01-01T00:00:00Z", canonical_url: "" },
        { slug: "b", updated_at: "2026-02-01T00:00:00Z", canonical_url: `${SITE}/blog/b` },
        { slug: "syndicated", updated_at: "2026-09-01T00:00:00Z", canonical_url: "https://medium.com/x" },
      ],
      SITE,
    );
    expect(entries).toEqual([
      { path: "/blog", lastModified: "2026-02-01T00:00:00.000Z" },
      { path: "/blog/a", lastModified: "2026-01-01T00:00:00.000Z" },
      { path: "/blog/b", lastModified: "2026-02-01T00:00:00.000Z" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Route handlers (real loaders, fake Supabase)
// ---------------------------------------------------------------------------
function populatedSupabase(extra: { errors?: string[] } = {}) {
  return fakeSitemapSupabase({
    errors: extra.errors,
    rpcResults: { interview_topic_detail: { questions: [{ id: "q1" }] } },
    rpcs: {
      learning_sitemap: [
        { grid_slug: "java-tutorial", topic_slug: null, updated_at: "2026-01-01T00:00:00Z" },
        { grid_slug: "java-tutorial", topic_slug: "intro", updated_at: "2026-02-01T00:00:00Z" },
        { grid_slug: "generative-ai", topic_slug: null, updated_at: "2026-01-01T00:00:00Z" },
        { grid_slug: "generative-ai", topic_slug: "activation-functions", updated_at: "2026-06-01T00:00:00Z" },
        { grid_slug: "generative-ai", topic_slug: "course-summary", updated_at: "2026-01-02T00:00:00Z" },
      ],
      coding_problems_sitemap: [
        { slug: "two-sum", updated_at: "2026-01-03T00:00:00Z" },
        { slug: "thin-problem", updated_at: "2026-01-04T00:00:00Z" },
      ],
      practice_problems_sitemap: [{ slug: "knapsack", updated_at: "2026-01-05T00:00:00Z" }],
      interview_questions_sitemap: [
        { category_slug: "java", topic_slug: "oop", updated_at: "2026-01-06T00:00:00Z" },
        { category_slug: "python", topic_slug: "basics", updated_at: "2026-01-07T00:00:00Z" },
      ],
    },
    tables: {
      faqs: [{ id: "f1" }],
      premium_plans: [{ id: "pl1" }],
      learning_grids: [{ id: "g-genai", slug: "generative-ai" }, { id: "g-java", slug: "java-tutorial" }],
      learning_topics: [
        { id: "t-intro", slug: "intro", grid_id: "g-java", is_premium: false },
        { id: "t-genai", slug: "activation-functions", grid_id: "g-genai", is_premium: false },
        { id: "t-summary", slug: "course-summary", grid_id: "g-genai", is_premium: false },
      ],
      learning_contents: [
        { id: "c-java", topic_id: "t-intro", body: "Real lesson content." },
        { id: "c1", topic_id: "t-genai", body: GENAI_TEMPLATE, learning_topics: { slug: "activation-functions" } },
        { id: "c2", topic_id: "t-summary", body: "Original synthesis.", learning_topics: { slug: "course-summary" } },
      ],
      dsa_problems: [
        { slug: "two-sum", examples: [{ input: "1" }], constraints: [], starter_code: {}, is_premium: false },
        { slug: "thin-problem", examples: [], constraints: [], starter_code: {}, is_premium: false },
      ],
      jobs: [{ id: "j1", company_id: "tcs", updated_at: "2026-01-08T00:00:00Z" }],
      companies: [
        { id: "tcs", updated_at: "2026-01-01T00:00:00Z" },
        { id: "microsoft", updated_at: "2026-01-01T00:00:00Z" },
      ],
      projects: [{ id: "p1", category_id: "web-development", updated_at: "2026-01-09T00:00:00Z" }],
      categories: [
        { id: "web-development", updated_at: "2026-01-10T00:00:00Z" },
        { id: "devops", updated_at: "2026-01-10T00:00:00Z" },
      ],
      blog_posts: [{ slug: "hello", updated_at: "2026-01-11T00:00:00Z", canonical_url: "" }],
    },
  });
}

describe("/sitemap.xml index + /sitemaps/<section>.xml routes", () => {
  it("sitemap routes render on demand while section data retains hourly caching", async () => {
    const r = await loadSitemapRoutes(populatedSupabase());
    expect(r.index.revalidate).toBe(3600);
    expect(r.index.dynamic).toBe("force-dynamic");
    for (const name of SITEMAP_SECTION_NAMES) {
      expect(r.sections[name].revalidate).toBe(3600);
      expect(r.sections[name].dynamic).toBe("force-dynamic");
    }
  });

  it("the index links all seven child sitemaps with lastmod = newest child lastmod", async () => {
    const r = await loadSitemapRoutes(populatedSupabase());
    const res = await r.index.GET();
    expect(res.headers.get("content-type")).toContain("application/xml");
    const xml = await res.text();
    expect(xml).toContain("<sitemapindex");
    expect(urlEntries(xml)).toEqual([
      { loc: `${SITE}/sitemaps/static.xml` },
      { loc: `${SITE}/sitemaps/learning.xml`, lastmod: "2026-06-01T00:00:00.000Z" },
      { loc: `${SITE}/sitemaps/problems.xml`, lastmod: "2026-01-05T00:00:00.000Z" },
      { loc: `${SITE}/sitemaps/interview-questions.xml`, lastmod: "2026-01-07T00:00:00.000Z" },
      { loc: `${SITE}/sitemaps/jobs.xml`, lastmod: "2026-01-08T00:00:00.000Z" },
      { loc: `${SITE}/sitemaps/projects.xml`, lastmod: "2026-01-10T00:00:00.000Z" },
      { loc: `${SITE}/sitemaps/blog.xml`, lastmod: "2026-01-11T00:00:00.000Z" },
    ]);
  });

  it("the index leaves out child sitemaps that have no URLs (no open jobs, no projects…)", async () => {
    const r = await loadSitemapRoutes(
      fakeSitemapSupabase({
        rpcs: { learning_sitemap: [{ grid_slug: "java-tutorial", topic_slug: "intro", updated_at: "2026-02-01T00:00:00Z" }] },
      }),
    );
    // Practice is a useful static hub; empty interview and blog sections are omitted.
    expect(locs(await r.indexXml())).toEqual([
      `${SITE}/sitemaps/static.xml`,
      `${SITE}/sitemaps/learning.xml`,
      `${SITE}/sitemaps/problems.xml`,
    ]);
    // The omitted child routes still answer with a valid (empty) urlset.
    expect(await r.sectionXml("jobs")).toContain("<urlset");
    expect(locs(await r.sectionXml("jobs"))).toEqual([]);
  });

  it("child sitemaps cover every public content type and keep the thin-content exclusions", async () => {
    const r = await loadSitemapRoutes(populatedSupabase());
    const all = await r.allLocs();
    for (const u of [
      SITE,
      `${SITE}/learning`,
      `${SITE}/learning/java-tutorial`,
      `${SITE}/learning/java-tutorial/intro`,
      `${SITE}/learning/generative-ai/course-summary`,
      `${SITE}/coding-problems/two-sum`,
      `${SITE}/practice/problems/knapsack`,
      `${SITE}/practice/interview-questions/java`,
      `${SITE}/practice/interview-questions/python`,
      `${SITE}/practice/interview-questions/python/basics`,
      `${SITE}/jobs/j1`,
      `${SITE}/jobs/companies/tcs`,
      `${SITE}/projects/p1`,
      `${SITE}/projects/category/web-development`,
      `${SITE}/blog/hello`,
    ]) {
      expect(all).toContain(u);
    }
    // thin / noindexed / excluded
    for (const u of [
      `${SITE}/learning/generative-ai/activation-functions`,
      `${SITE}/coding-problems/thin-problem`,
      `${SITE}/jobs/companies/microsoft`,
      `${SITE}/projects/category/devops`,
      `${SITE}/practice/compiler`,
    ]) {
      expect(all).not.toContain(u);
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it("never stamps build/request time as lastmod", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-12-31T23:59:59.000Z"));
    const r = await loadSitemapRoutes(populatedSupabase());
    const xmls = [await r.indexXml(), ...(await Promise.all(SITEMAP_SECTION_NAMES.map((n) => r.sectionXml(n))))];
    for (const xml of xmls) expect(xml).not.toContain("2031-12-31");
    expect(urlEntries(await r.sectionXml("static")).every((e) => e.lastmod === undefined)).toBe(true);
  });

  it("pages through results past PostgREST's 1000-row cap instead of truncating", async () => {
    const many = Array.from({ length: 2500 }, (_, i) => ({
      grid_slug: "java-tutorial",
      topic_slug: `t${String(i).padStart(4, "0")}`,
      updated_at: "2026-01-01T00:00:00Z",
    }));
    const supabase = fakeSitemapSupabase({
      rpcs: { learning_sitemap: many },
      tables: {
        learning_grids: [{ id: "g-java", slug: "java-tutorial" }],
        learning_topics: many.map((r, i) => ({ id: `t${i}`, slug: r.topic_slug, grid_id: "g-java", is_premium: false })),
        learning_contents: many.map((_, i) => ({ id: `c${i}`, topic_id: `t${i}` })),
      },
    });
    const r = await loadSitemapRoutes(supabase);
    const topicLocs = locs(await r.sectionXml("learning")).filter((u) => u.includes("/learning/java-tutorial/"));
    expect(topicLocs).toHaveLength(2500);
    const ranges = supabase.calls
      .filter((c) => c.name === "learning_sitemap")
      .map((c) => c.ops.find((o) => o[0] === "range"));
    expect(ranges).toEqual([
      ["range", 0, 999],
      ["range", 1000, 1999],
      ["range", 2000, 2999],
      ["range", 2500, 3499],
    ]);
  });

  it("a cold failed query returns retryable 503 instead of a successful truncated sitemap", async () => {
    const r = await loadSitemapRoutes(populatedSupabase({ errors: ["learning_sitemap"] }));
    for (const response of [await r.sections.learning.GET(), await r.index.GET()]) {
      expect(response.status).toBe(503);
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.text()).not.toContain("<urlset");
    }
  });

  it("missing configuration returns retryable failure without publishing empty sections", async () => {
    const r = await loadSitemapRoutes(null);
    for (const response of [await r.index.GET(), ...await Promise.all(Object.values(r.sections).map(section => section.GET()))]) {
      expect(response.status).toBe(503);
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.text()).not.toContain("<urlset");
    }
  });

  it("every section's cached loader carries the learning:sitemap tag (POST /api/revalidate contract)", async () => {
    const calls: { keyParts: string[]; tags: string[]; revalidate: number }[] = [];
    vi.resetModules();
    vi.doMock("next/cache", () => ({
      unstable_cache: <T>(fn: T, keyParts: string[], opts: { tags: string[]; revalidate: number }) => {
        calls.push({ keyParts, tags: opts.tags, revalidate: opts.revalidate });
        return fn;
      },
    }));
    vi.doMock("@/lib/supabase/server", () => ({ getPublicSupabase: () => null }));
    await import("@/lib/sitemap/data");
    const sections = calls.filter((c) => c.keyParts[0] === "sitemap:section");
    expect(sections.map((c) => c.keyParts[1]).sort()).toEqual([...SITEMAP_SECTION_NAMES].sort());
    for (const c of sections) {
      expect(c.tags).toContain("learning:sitemap");
      expect(c.revalidate).toBe(3600);
    }
  });
});

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
describe("robots.txt", () => {
  it("points at the sitemap index", async () => {
    const { default: robots } = await import("@/app/robots");
    expect(robots().sitemap).toBe(`${SITE}/sitemap.xml`);
  });

  it("no Disallow rule prefix-blocks a public page (robots rules are prefix matches)", async () => {
    const { default: robots } = await import("@/app/robots");
    const rules = robots().rules as { allow: string; disallow: string[] };
    expect(rules.allow).toBe("/");
    const publicPaths = [
      ...STATIC_SITEMAP_PATHS.filter((p) => p !== "/"),
      ...SITEMAP_EXCLUDED_PATHS,
      "/resume/templates",
      "/referral",
      "/refund-policy",
      "/learning/java-tutorial/intro",
      "/practice",
      "/practice/problems/knapsack",
      "/practice/interview-questions/java/oop",
      "/coding-problems/two-sum",
      "/jobs/companies/tcs",
      "/projects/category/web-development",
      "/blog/hello",
      "/custom-projects",
      "/search",
      "/sitemap.xml",
      "/sitemaps/learning.xml",
    ];
    for (const path of publicPaths) {
      for (const rule of rules.disallow) expect(path.startsWith(rule), `${rule} blocks ${path}`).toBe(false);
    }
  });

  it("still blocks the private / utility areas", async () => {
    const { default: robots } = await import("@/app/robots");
    const { disallow } = robots().rules as { disallow: string[] };
    for (const path of ["/account/wallet", "/api/session", "/auth/callback", "/r/abc123", "/custom-projects/checkout", "/practice/submissions"]) {
      expect(disallow.some((rule) => path.startsWith(rule)), path).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 404 canonical
// ---------------------------------------------------------------------------
describe("not-found page metadata", () => {
  it("clears the root layout's homepage canonical and is noindex", async () => {
    const { metadata } = await import("@/app/not-found");
    expect(metadata.alternates).toEqual({ canonical: null });
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("the root layout no longer hands every page the homepage canonical", async () => {
    const { metadata } = await import("@/app/layout");
    expect(metadata.alternates?.canonical).toBeUndefined();
  });

  it("the homepage declares its own canonical", () => {
    const src = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(src).toMatch(/alternates:\s*\{\s*canonical:\s*"\/"\s*\}/);
  });
});


describe("empty sitemap hubs", () => {
  it("omits learning and interview hubs without content", () => {
    expect(buildLearningEntries([], new Set())).toEqual([]);
    expect(buildInterviewEntries([])).toEqual([]);
  });
});

describe("bounded sitemap reads", () => {
  it("rejects a stalled transport instead of waiting indefinitely", async () => {
    await loadSitemapRoutes(null);
    const { readAllPages } = await import("@/lib/sitemap/data");
    vi.useFakeTimers();
    const reading = readAllPages(() => new Promise(() => {}));
    const assertion = expect(reading).rejects.toThrow("temporarily unavailable");
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });
  it("fails closed at the row cap instead of returning truncated results", async () => {
    await loadSitemapRoutes(null);
    const { readAllPages } = await import("@/lib/sitemap/data");
    await expect(readAllPages(async () => ({ data: [{ id: 1 }], error: null }), { pageSize: 1, maxRows: 2 })).rejects.toThrow("limit reached");
  });
});
