import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

// Model React's render lifetime and identity-based argument comparison.
// These isolated tests exercise real Supabase query builders against fake HTTP.
const render = vi.hoisted(() => ({ memo: new Map<unknown, Map<unknown, unknown>>() }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  cache: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => {
    if (!render.memo.has(fn)) render.memo.set(fn, new Map());
    let node = render.memo.get(fn)!;
    for (const arg of args) {
      if (!node.has(arg)) node.set(arg, new Map());
      node = node.get(arg) as Map<unknown, unknown>;
    }
    if (!node.has(fn)) node.set(fn, fn(...args));
    return node.get(fn);
  },
}));
const persistentRead = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => {
    persistentRead();
    return fn(...args);
  },
}));

import * as blog from "@/lib/blog";
import * as learning from "@/lib/learning";
import { getCachedHomeData } from "@/lib/cache";
import BlogIndexPage, { generateMetadata } from "@/app/blog/page";
import { getPublicSupabase } from "@/lib/supabase/server";
import { PublicContentOverload, RevisionCache } from "@/lib/revisionCache";
import GlobalError from "@/app/error";

type Row = Record<string, any>;
let posts: Row[];
let categories: Row[];
let rpc: Record<string, unknown>;
let failed: string | undefined;
let revisionFailureCode: string;
let revisionToken: string | null;
let revisionCalls: number;
let duringPayload: (() => void) | undefined;
let nullResponseTable: string | undefined;
let revisionSerial = 0;
const advanceRevision = () => { revisionToken = `00000000-0000-4000-8000-${String(++revisionSerial).padStart(12, "0")}`; };
let calls: { host: string; path: string; select: string | null; cache: RequestCache | undefined; bytes: number }[];
const newRender = () => render.memo.clear();
const post = (n: number, status = "published"): Row => ({
  id: `p${n}`, title: `Article ${n}`, slug: `article-${n}`, status,
  excerpt: `Excerpt ${n}`, category_id: "cat-1", category_name: "Programming",
  category: { slug: "programming" }, tags: ["code"], reading_time: 2,
  published_at: `2026-10-${String(30 - n).padStart(2, "0")}T00:00:00Z`,
  content: "A full article body. ".repeat(100), updated_at: "2026-10-30T00:00:00Z",
});

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  newRender();
  persistentRead.mockClear();
  posts = Array.from({ length: 14 }, (_, i) => post(i + 1));
  posts.push(post(20, "draft"), post(21, "archived"));
  categories = [{ id: "cat-1", name: "Programming", slug: "programming", description: "Code" }];
  rpc = {
    learning_grids_list: [{ id: "g1", slug: "java", name: "Java", topic_count: 1 }],
    learning_tree: { grid: { id: "g1", slug: "java" }, sections: [{ topics: [{ slug: "intro", title: "Intro" }] }] },
    learning_topic_content: { locked: false, contents: [{ body: "Public lesson" }], prev: null, next: { slug: "loops" } },
    learning_topic_practice: { mock_tests: [], coding_problems: [] },
  };
  failed = undefined;
  revisionFailureCode = "08006";
  revisionToken = null;
  revisionCalls = 0;
  duringPayload = undefined;
  nullResponseTable = undefined;
  calls = [];
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://staging-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "unit-test-anon");
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const name = url.pathname.split("/").at(-1)!;
    if (name === "public_content_revision") {
      revisionCalls++;
      expect(init?.cache).toBe("no-store");
      if (failed === name) return new Response(JSON.stringify({ code: revisionFailureCode, message: "failure" }),
        { status: revisionFailureCode === "42501" ? 403 : 500 });
      return revisionToken
        ? new Response(JSON.stringify(revisionToken), { headers: { "content-type": "application/json" } })
        : new Response(JSON.stringify({ code: "PGRST202", message: "not installed" }), { status: 404 });
    }
    let data: unknown = [];
    let total = 0;
    if (url.pathname.includes("/rpc/")) {
      expect(JSON.parse(String(init?.body)).p_platform).toBe("website");
      data = rpc[name];
    } else {
      let rows = name === "blog_posts" ? posts : name === "blog_categories" ? categories : [];
      for (const [key, filter] of url.searchParams) {
        if (filter.startsWith("eq.")) rows = rows.filter((r) => String(r[key]) === filter.slice(3));
        if (filter.startsWith("neq.")) rows = rows.filter((r) => String(r[key]) !== filter.slice(4));
        if (filter.startsWith("ilike.")) rows = rows.filter((r) => String(r[key]).toLowerCase() === filter.slice(6).toLowerCase());
        if (filter.startsWith("lt.")) rows = rows.filter((r) => String(r[key]) < filter.slice(3));
        if (filter.startsWith("gt.")) rows = rows.filter((r) => String(r[key]) > filter.slice(3));
      }
      const order = url.searchParams.get("order");
      if (order?.startsWith("published_at")) rows = [...rows].sort((a, b) =>
        (order.includes("desc") ? -1 : 1) * a.published_at.localeCompare(b.published_at));
      total = rows.length;
      const from = Number(url.searchParams.get("offset") ?? 0);
      rows = rows.slice(from, from + Number(url.searchParams.get("limit") ?? rows.length));
      const select = url.searchParams.get("select")?.split(",") ?? [];
      rows = rows.map((r) => Object.fromEntries(select.map((key) => {
        const field = key.startsWith("category:") ? "category" : key;
        return [field, r[field]];
      })));
      const headers = new Headers(init?.headers);
      data = headers.get("accept")?.includes("object+json") ? rows[0] ?? null : rows;
    }
    const body = JSON.stringify(failed === name ? { message: "fixture upstream failure", code: "TEST_FAILURE" }
      : nullResponseTable === name ? null : data);
    calls.push({ host: url.host, path: name, select: url.searchParams.get("select"), cache: init?.cache, bytes: Buffer.byteLength(body) });
    duringPayload?.();
    return new Response(body, { status: failed === name ? 400 : 200, headers: {
      "content-type": "application/json", "content-range": `0-${Math.max(0, total - 1)}/${total}`,
    } });
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("public browsing query budget", () => {
  it("shares listing reads across distinct metadata/page argument objects", async () => {
    const [a, b] = await Promise.all([blog.getBlogPage({ page: 1 }), blog.getBlogPage({ page: 1 })]);
    expect(a).toBe(b);
    expect(a.posts.map((p) => p.slug)).toEqual(Array.from({ length: 12 }, (_, i) => `article-${i + 1}`));
    expect(a.total).toBe(14);
    expect(calls).toHaveLength(1);
    expect(calls[0].select).not.toContain("content");
  });

  it("renders all page-one cards with one count query and no Featured read", async () => {
    await generateMetadata({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(await BlogIndexPage({ searchParams: Promise.resolve({}) }));
    for (let n = 1; n <= 12; n++) expect(html).toContain(`href="/blog/article-${n}"`);
    expect(html).not.toContain('/blog/article-20');
    expect(html).toContain("Featured articles");
    expect(html).toContain("Latest articles");
    expect(calls.map((c) => c.path).sort()).toEqual(["blog_categories", "blog_posts"]);
    expect(persistentRead).not.toHaveBeenCalled();
  });

  it("shares category filtering/chips and avoids posts queries for unknown categories", async () => {
    await Promise.all([blog.getBlogPage({ page: 1, category: "programming" }), blog.getBlogCategories()]);
    expect(calls.filter((c) => c.path === "blog_categories")).toHaveLength(1);
    newRender(); calls = [];
    expect(await blog.getBlogPage({ page: 1, category: "unknown" })).toEqual({ posts: [], total: 0, missing: false });
    expect(calls.map((c) => c.path)).toEqual(["blog_categories"]);
  });

  it("keeps pagination identities separate and preserves the last-page bound", async () => {
    const [first, second] = await Promise.all([blog.getBlogPage({ page: 1 }), blog.getBlogPage({ page: 2 })]);
    expect(first.posts).toHaveLength(12);
    expect(second.posts.map((p) => p.id)).toEqual(["p13", "p14"]);
  });

  it("selects only titles/slugs and preserves older/newer article ordering", async () => {
    const nav = await blog.getAdjacentPosts(posts[1].published_at);
    expect(nav.prev?.slug).toBe("article-3");
    expect(nav.next?.slug).toBe("article-1");
    expect(calls).toHaveLength(2);
    expect(calls.every((c) => c.select === "title,slug")).toBe(true);
  });
});

// These compatibility cases deliberately model staging before migration 0155.
describe("fresh public results and failures before the revision RPC is installed", () => {
  it("sees edit, unpublish, publish and delete on the next render without a webhook", async () => {
    expect((await blog.getBlogPost("article-1"))?.title).toBe("Article 1");
    posts[0].title = "Edited title"; newRender();
    expect((await blog.getBlogPost("article-1"))?.title).toBe("Edited title");
    posts[0].status = "draft"; newRender();
    expect(await blog.getBlogPost("article-1")).toBeNull();
    posts[0].status = "published"; newRender();
    expect(await blog.getBlogPost("article-1")).not.toBeNull();
    posts.shift(); newRender();
    expect(await blog.getBlogPost("article-1")).toBeNull();
    expect(persistentRead).not.toHaveBeenCalled();
  });

  it("rechecks the trusted RPC's visibility/protection result on each render", async () => {
    expect((await learning.getLearningTopicPage("java", "intro"))?.contents).toHaveLength(1);
    rpc.learning_topic_content = { locked: true, contents: [], prev: null, next: null }; newRender();
    expect(await learning.getLearningTopicPage("java", "intro")).toMatchObject({ locked: true, contents: [] });
    // The unchanged trusted RPC returns null for hidden, deleted, unpublished,
    // or targeted content. This tests cache handling, not SQL authorization.
    rpc.learning_topic_content = null; rpc.learning_tree = null; rpc.learning_grids_list = []; newRender();
    expect(await learning.getLearningTopicPage("java", "intro")).toBeNull();
    expect(await learning.getLearningTree("java")).toBeNull();
    expect(await learning.getLearningGrids()).toEqual([]);
    expect(persistentRead).not.toHaveBeenCalled();
  });

  it("shares course reads but keeps different lesson identities separate", async () => {
    await Promise.all([learning.getLearningTree("java"), learning.getLearningTree("java")]);
    await Promise.all([learning.getLearningTopicPage("java", "intro"), learning.getLearningTopicPage("java", "loops")]);
    expect(calls.map((c) => c.path)).toEqual(["learning_tree", "learning_topic_content", "learning_topic_content"]);
  });

  it("reads course headers and assessment metadata fresh and surfaces their failures", async () => {
    expect(await learning.getLearningGridBrief("hidden-course")).toBeNull();
    expect(await learning.getGridScopedTests("g1")).toEqual({ courseTest: null, chapterTestBySectionId: {} });
    expect(calls.every((c) => c.cache === "no-store")).toBe(true);
    expect(calls.every((c) => !c.select?.includes("*"))).toBe(true);
    failed = "learning_grids"; newRender();
    await expect(learning.getLearningGridBrief("java")).rejects.toThrow("unavailable");
    failed = "practice_tests"; newRender();
    await expect(learning.getGridScopedTests("g1")).rejects.toThrow("unavailable");
  });

  it("shares discovery's catalog read and rejects failures instead of caching empty discovery", async () => {
    await learning.getLearningGrids();
    const discovery = await learning.getTopicDiscovery("java", "Java");
    expect(discovery.tutorials).toEqual([]);
    expect(calls.filter((c) => c.path === "learning_grids_list")).toHaveLength(1);
    expect(persistentRead).not.toHaveBeenCalled();
    expect(calls.every((c) => c.cache === "no-store")).toBe(true);
    failed = "projects"; newRender();
    await expect(learning.getTopicDiscovery("java", "Java")).rejects.toThrow("unavailable");
  });

  it("keeps published previews free of bodies and rejects preview/category/navigation errors", async () => {
    const latest = await blog.getLatestPosts(3);
    expect(latest.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(calls[0].select).not.toContain("content");
    failed = "blog_posts"; newRender();
    await expect(blog.getLatestPosts(3)).rejects.toThrow("unavailable");
    await expect(blog.getRelatedPosts("p1", "Programming")).rejects.toThrow("unavailable");
    await expect(blog.getAdjacentPosts(posts[1].published_at)).rejects.toThrow("unavailable");
    failed = "blog_categories"; newRender();
    await expect(blog.getBlogCategories()).rejects.toThrow("unavailable");
  });

  it.each(["blog_posts", "learning_grids_list", "learning_tree", "learning_topic_content", "learning_topic_practice"])(
    "distinguishes %s failure from absence and retries next render", async (name) => {
      const read = name === "blog_posts" ? () => blog.getBlogPost("article-1")
        : name === "learning_grids_list" ? learning.getLearningGrids
        : name === "learning_tree" ? () => learning.getLearningTree("java")
        : name === "learning_topic_practice" ? () => learning.getTopicPractice("java", "intro")
        : () => learning.getLearningTopicPage("java", "intro");
      failed = name;
      await expect(read()).rejects.toThrow("unavailable");
      failed = undefined; newRender();
      await expect(read()).resolves.not.toBeNull();
    },
  );

  it("keeps environments separate and sends fresh requests without a user session", async () => {
    await blog.getBlogPost("article-1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://preview-fixture.invalid"); newRender();
    await blog.getBlogPost("article-1");
    expect(calls.map((c) => c.host)).toEqual(["staging-fixture.invalid", "preview-fixture.invalid"]);
    expect(calls.every((c) => c.cache === "no-store")).toBe(true);
    expect((await getPublicSupabase({ fresh: true })!.auth.getSession()).data.session).toBeNull();
  });

  it("deduplicates Home's batch and rejects upstream failures without storing empty content", async () => {
    await Promise.all([getCachedHomeData(), getCachedHomeData()]);
    expect(calls).toHaveLength(5);
    expect(calls.every((c) => c.cache === "no-store")).toBe(true);
    expect(persistentRead).not.toHaveBeenCalled();
    failed = "banners"; newRender();
    await expect(getCachedHomeData()).rejects.toThrow("unavailable");
    failed = undefined; newRender();
    await expect(getCachedHomeData()).resolves.toMatchObject({ banners: [] });
  });
});


describe("atomic-revision payload reuse (isolated HTTP fixtures)", () => {
  beforeEach(() => advanceRevision());

  it("reuses Blog payload/count/categories across renders with one authoritative check", async () => {
    const renderIndex = async () => Promise.all([blog.getBlogPage({ page: 1 }), blog.getBlogCategories()]);
    const first = await renderIndex();
    expect(calls).toHaveLength(2);
    expect(revisionCalls).toBe(3); // initial + each cold fill verification
    newRender(); calls = []; revisionCalls = 0;
    const repeated = await renderIndex();
    expect(repeated).toEqual(first);
    expect(calls).toHaveLength(0);
    expect(revisionCalls).toBe(1);
    expect(persistentRead).not.toHaveBeenCalled(); // no Next data cache
  });

  it("keeps pagination and category identity separate across warm renders", async () => {
    await blog.getBlogPage({ page: 1 });
    await blog.getBlogPage({ page: 2 });
    newRender(); calls = [];
    expect((await blog.getBlogPage({ page: 2 })).posts.map(p => p.id)).toEqual(["p13", "p14"]);
    expect(calls).toHaveLength(0);
    expect((await blog.getBlogPage({ page: 1, category: "unknown" })).posts).toEqual([]);
    expect(calls.map(c => c.path)).toEqual(["blog_categories"]);
  });

  it("honors edits, category changes, unpublish, delete and republish without admin refresh", async () => {
    await blog.getBlogPost("article-1");
    for (const action of ["edit", "category", "unpublish", "publish", "delete"]) {
      if (action === "edit") posts[0].title = "Changed";
      if (action === "category") posts[0].category = { slug: "changed" };
      if (action === "unpublish") posts[0].status = "draft";
      if (action === "publish") posts[0].status = "published";
      if (action === "delete") posts.shift();
      advanceRevision(); newRender();
      const result = await blog.getBlogPost("article-1");
      if (action === "delete" || action === "unpublish") expect(result).toBeNull();
      else expect(result?.title).toBe("Changed");
      if (action === "category") expect(result?.category_slug).toBe("changed");
    }
  });

  it("reuses course tree, lesson, header and assessment metadata", async () => {
    const read = () => Promise.all([
      learning.getLearningGrids(), learning.getLearningTree("java"),
      learning.getLearningTopicPage("java", "intro"), learning.getTopicPractice("java", "intro"),
      learning.getLearningGridBrief("java"), learning.getGridScopedTests("g1"),
    ]);
    const first = await read();
    expect(calls).toHaveLength(7);
    newRender(); calls = []; revisionCalls = 0;
    expect(await read()).toEqual(first);
    expect(calls).toHaveLength(0);
    expect(revisionCalls).toBe(1);
    expect(first[1]?.sections[0].topics[0].slug).toBe("intro");
  });

  it("uses new keys for child edits, protection and parent/child removal", async () => {
    await learning.getLearningTopicPage("java", "intro");
    rpc.learning_topic_content = { locked: false, contents: [{ body: "Edited child" }] };
    advanceRevision(); newRender();
    expect(await learning.getLearningTopicPage("java", "intro")).toMatchObject({ contents: [{ body: "Edited child" }] });
    rpc.learning_topic_content = { locked: true, contents: [] };
    advanceRevision(); newRender();
    expect(await learning.getLearningTopicPage("java", "intro")).toMatchObject({ locked: true, contents: [] });
    rpc.learning_topic_content = null; rpc.learning_tree = null;
    advanceRevision(); newRender();
    expect(await learning.getLearningTopicPage("java", "intro")).toBeNull();
    expect(await learning.getLearningTree("java")).toBeNull();
  });

  it("uses a fresh anonymous projection on transient revision failure instead of an old payload", async () => {
    await blog.getBlogPost("article-1");
    posts[0].title = "Fresh during revision outage";
    failed = "public_content_revision"; newRender(); calls = [];
    expect(await blog.getBlogPost("article-1")).toMatchObject({ title: "Fresh during revision outage" });
    expect(calls.map(c => c.path)).toEqual(["blog_posts"]);
    posts[0].status = "draft"; newRender();
    expect(await blog.getBlogPost("article-1")).toBeNull();
    failed = undefined; newRender();
    advanceRevision();
    expect(await blog.getBlogPost("article-1")).toBeNull();
  });

  it("respects newly protected lessons during a revision outage", async () => {
    await learning.getLearningTopicPage("java", "intro");
    failed = "public_content_revision";
    rpc.learning_topic_content = { locked: true, contents: [] };
    newRender();
    expect(await learning.getLearningTopicPage("java", "intro")).toMatchObject({ locked: true, contents: [] });
  });

  it("keeps failing closed when neither revision nor fresh publication can be read", async () => {
    await blog.getBlogPost("article-1");
    failed = "public_content_revision"; newRender();
    const upstream = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes("/rest/v1/blog_posts")
        ? Promise.resolve(new Response(JSON.stringify({ code: "08006", message: "Unavailable" }), { status: 400 }))
        : upstream(input, init)));
    await expect(blog.getBlogPost("article-1")).rejects.toThrow("unavailable");
  });

  it("serves a warm payload during failed background refresh only while its revision is current", async () => {
    vi.useFakeTimers();
    try {
      await blog.getBlogPost("article-1");
      await vi.advanceTimersByTimeAsync(60_000);
      failed = "blog_posts"; newRender(); calls = [];
      expect(await blog.getBlogPost("article-1")).toMatchObject({ slug: "article-1" });
      await vi.advanceTimersByTimeAsync(0);
      expect(calls.map(c => c.path)).toEqual(["blog_posts"]);
      advanceRevision(); newRender();
      await expect(blog.getBlogPost("article-1")).rejects.toThrow("unavailable");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports sanitized timing and counters for revision failures", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    failed = "public_content_revision";
    await blog.getBlogPost("article-1");
    const entry = errors.mock.calls.map(([line]) => JSON.parse(line))
      .find(log => log.event === "public_content_revision_failed");
    expect(entry).toMatchObject({ scope: "blog", code: "08006", recoverable: true });
    expect(entry.duration_ms).toBeGreaterThanOrEqual(0);
    expect(entry.failure_count).toBeGreaterThan(0);
    expect(entry.check_count).toBeGreaterThanOrEqual(entry.failure_count);
    expect(JSON.stringify(entry)).not.toMatch(/staging-fixture|unit-test-anon|Article|failure\"/);
  });

  it("falls back after two bounded attempts even if a revision transport ignores abort", async () => {
    vi.useFakeTimers();
    try {
      const upstream = globalThis.fetch;
      vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
        String(input).includes("/rpc/public_content_revision")
          ? new Promise<Response>(() => {})
          : upstream(input, init)));
      const result = blog.getBlogPost("article-1");
      await vi.advanceTimersByTimeAsync(4999);
      expect(calls).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(1);
      expect(await result).toMatchObject({ slug: "article-1" });
      expect(calls.map(c => c.path)).toEqual(["blog_posts"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never returns stale payloads on failed refreshes or stores failed fills", async () => {
    await blog.getBlogPost("article-1");
    advanceRevision(); newRender(); failed = "blog_posts";
    await expect(blog.getBlogPost("article-1")).rejects.toThrow("unavailable");
    failed = undefined; newRender(); posts[0].title = "Recovered";
    expect((await blog.getBlogPost("article-1"))?.title).toBe("Recovered");
  });

  it("separates endpoint and anonymous credential identities; never uses visitor sessions", async () => {
    await blog.getBlogPost("article-1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://other-fixture.invalid"); newRender();
    await blog.getBlogPost("article-1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "other-unit-test-anon"); newRender();
    await blog.getBlogPost("article-1");
    expect(calls.map(c => c.host)).toEqual(["staging-fixture.invalid", "other-fixture.invalid", "other-fixture.invalid"]);
    expect((await getPublicSupabase({ fresh: true })!.auth.getSession()).data.session).toBeNull();
  });

  it("reuses four Home reads while checking time-dependent jobs every render", async () => {
    await getCachedHomeData();
    expect(calls).toHaveLength(5);
    newRender(); calls = []; revisionCalls = 0;
    await getCachedHomeData();
    expect(calls.map(c => c.path)).toEqual(["jobs"]);
    expect(revisionCalls).toBe(1);
    advanceRevision(); newRender(); calls = [];
    await getCachedHomeData();
    expect(calls).toHaveLength(5);
  });
});


describe("revision races and concurrent renders", () => {
  beforeEach(() => advanceRevision());

  it("rejects a fill overlapping a write instead of storing mixed/old results", async () => {
    duringPayload = () => {
      duringPayload = undefined;
      posts[0].title = "Concurrent edit";
      advanceRevision();
    };
    await expect(blog.getBlogPost("article-1")).rejects.toThrow("changed during read");
    expect(calls).toHaveLength(1);
    newRender(); calls = [];
    expect((await blog.getBlogPost("article-1"))?.title).toBe("Concurrent edit");
    expect(calls).toHaveLength(1);
  });

  it("bounds work during sustained writes and recovers on a later render", async () => {
    duringPayload = advanceRevision;
    await expect(blog.getBlogPost("article-1")).rejects.toThrow("changed during read");
    expect(calls).toHaveLength(1);
    duringPayload = undefined; newRender();
    expect(await blog.getBlogPost("article-1")).not.toBeNull();
  });

  it("rejects a failed post-fill verification without admitting the payload", async () => {
    duringPayload = () => { duringPayload = undefined; failed = "public_content_revision"; };
    await expect(blog.getBlogPost("article-1")).rejects.toThrow("revision is unavailable");
    failed = undefined; newRender(); calls = [];
    await blog.getBlogPost("article-1");
    expect(calls).toHaveLength(1);
  });

  it("joins the same fill across independent renders in one process", async () => {
    const first = blog.getBlogPost("article-1");
    newRender();
    const second = blog.getBlogPost("article-1");
    const results = await Promise.all([first, second]);
    expect(results[0]).toEqual(results[1]);
    expect(calls).toHaveLength(1);
    expect(revisionCalls).toBe(3); // two render checks, one fill verification
  });

  it("does not promote memoized category dependencies into a newer revision", async () => {
    await blog.getBlogCategories();
    duringPayload = () => {
      duringPayload = undefined;
      categories[0].slug = "renamed";
      advanceRevision();
    };
    await expect(blog.getBlogPage({ page: 1, category: "programming" }))
      .rejects.toThrow("changed during read");
    newRender();
    expect((await blog.getBlogPage({ page: 1, category: "programming" })).posts).toEqual([]);
    expect((await blog.getBlogPage({ page: 1, category: "renamed" })).posts).toHaveLength(12);
  });

  it.each(["banners", "practice_tests"])("rejects malformed %s results instead of caching absence", async (table) => {
    nullResponseTable = table;
    const read = table === "banners" ? getCachedHomeData : () => learning.getGridScopedTests("g1");
    await expect(read()).rejects.toThrow("unavailable");
    nullResponseTable = undefined; newRender(); calls = [];
    await expect(read()).resolves.toBeDefined();
    expect(calls.some(c => c.path === table)).toBe(true);
  });
});

describe("terminal public-read failures", () => {
  beforeEach(() => advanceRevision());

  it("keeps SQL permission removal fail-closed even with a warm payload", async () => {
    await blog.getBlogPost("article-1");
    failed = "public_content_revision"; revisionFailureCode = "42501";
    newRender(); calls = [];
    await expect(blog.getBlogPost("article-1")).rejects.toThrow("revision is unavailable");
    expect(calls).toHaveLength(0);
  });

  it.each(["queue-full", "deadline"] as const)("propagates %s overload to the existing retry boundary", async (reason) => {
    const error = new PublicContentOverload(reason);
    const storage = vi.spyOn(RevisionCache.prototype, "read").mockRejectedValue(error);
    await expect(BlogIndexPage({ searchParams: Promise.resolve({}) })).rejects.toBe(error);
    await expect(generateMetadata({ searchParams: Promise.resolve({}) })).rejects.toBe(error);
    // The actual shared error component renders a retry state, never a 404 or
    // the successful Blog empty state. Streaming can already have sent HTTP 200.
    const html = renderToStaticMarkup(createElement(GlobalError, { error, reset: vi.fn() }));
    expect(html).toContain("This page hit a snag");
    expect(html).toContain("Try again");
    expect(html).not.toContain("No articles yet");
    storage.mockRestore(); newRender();
    expect((await blog.getBlogPage({ page: 1 })).posts).toHaveLength(12);
  });
});
