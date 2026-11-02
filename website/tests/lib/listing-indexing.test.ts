import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildBlogEntries, buildProblemEntries } from "@/lib/sitemap/build";

const state = vi.hoisted(() => ({
  client: true,
  posts: { data: [] as unknown, count: 0, error: null as unknown },
  category: { data: [] as unknown, error: null as unknown },
  practice: { data: { items: [], total: 0 } as unknown, error: null as unknown },
}));
// Execute the real cache callback: failures must reject at the cache boundary,
// rather than resolve an empty result that Next would cache as successful.
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(), cache: <T>(fn: T) => fn,
}));
vi.mock("@/lib/supabase/server", () => ({
  getPublicSupabase: () => state.client ? {
    from: (table: string) => {
      const result = () => table === "blog_categories" ? state.category : state.posts;
      const chain = {
        select: () => chain, eq: () => chain, order: () => chain,
        range: () => chain, contains: () => chain, or: () => chain,
        maybeSingle: async () => result(),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
      };
      return chain;
    },
    rpc: async (name: string) => name === "public_content_revision"
      ? { data: null, error: { code: "PGRST202" } } // pre-migration staging
      : state.practice,
  } : null,
}));

import { getBlogPage } from "@/lib/blog";
import { getPracticeProblemsPage } from "@/lib/practice";
import { generateMetadata as blogMetadata } from "@/app/blog/page";
import { generateMetadata as practiceMetadata } from "@/app/practice/problems/page";

const SITE = "https://www.campusedux.com";
beforeEach(() => {
  state.client = true;
  state.posts = { data: [], count: 0, error: null };
  state.category = { data: [], error: null };
  state.practice = { data: { items: [], total: 0 }, error: null };
});

describe("listing metadata and sitemap agreement", () => {
  it("noindexes genuine empty listings and omits both hubs from sitemaps", async () => {
    expect(await getBlogPage({ page: 1 })).toMatchObject({ posts: [], total: 0, missing: false });
    expect(await getPracticeProblemsPage({ page: 1 })).toEqual({ items: [], total: 0 });
    for (const metadata of [blogMetadata, practiceMetadata]) {
      expect((await metadata({ searchParams: Promise.resolve({}) })).robots).toMatchObject({ index: false });
    }
    expect(buildBlogEntries([], SITE)).toEqual([]);
    expect(buildProblemEntries([], new Set(), []).map((e) => e.path)).not.toContain("/practice/problems");
  });

  it("includes populated hubs, preserving canonical overrides on blog details", async () => {
    state.posts = { data: [{ id: "b", slug: "syndicated", title: "Article" }], count: 1, error: null };
    state.practice.data = { items: [{ id: "p", slug: "sum" }], total: 1 };
    for (const metadata of [blogMetadata, practiceMetadata]) {
      expect((await metadata({ searchParams: Promise.resolve({}) })).robots).toBeUndefined();
    }
    expect(buildBlogEntries([{ slug: "syndicated", updated_at: null, canonical_url: "https://example.com/article" }], SITE).map((e) => e.path)).toEqual(["/blog"]);
    expect(buildProblemEntries([], new Set(), [{ slug: "sum", updated_at: null }]).map((e) => e.path)).toContain("/practice/problems");
  });

  it.each([{ page: "99" }, { q: "no-match" }])("noindexes empty pagination/filter results %j", async (searchParams) => {
    expect((await blogMetadata({ searchParams: Promise.resolve(searchParams) })).robots).toMatchObject({ index: false });
    expect((await practiceMetadata({ searchParams: Promise.resolve(searchParams) })).robots).toMatchObject({ index: false });
  });
});

describe("backend failures never become empty/noindex listings", () => {
  it.each(["timeout", "42P01", "PGRST205"])("rejects blog read errors (%s), then allows recovery", async (code) => {
    state.posts = { data: null, count: 0, error: { code } };
    await expect(getBlogPage({ page: 1 })).rejects.toThrow("Blog listing is unavailable");
    await expect(blogMetadata({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    state.posts = { data: [{ id: "b", slug: "back" }], count: 1, error: null };
    expect((await blogMetadata({ searchParams: Promise.resolve({}) })).robots).toBeUndefined();
  });

  it("distinguishes a failed category lookup from an unknown category", async () => {
    state.category.error = { message: "timeout" };
    await expect(blogMetadata({ searchParams: Promise.resolve({ category: "java" }) })).rejects.toThrow("Blog categories are unavailable");
    state.category.error = null;
    expect((await blogMetadata({ searchParams: Promise.resolve({ category: "unknown" }) })).robots).toMatchObject({ index: false });
  });

  it("rejects practice RPC errors and retries successfully", async () => {
    state.practice = { data: null, error: { message: "timeout" } };
    await expect(getPracticeProblemsPage({ page: 1 })).rejects.toThrow("Practice listing is unavailable");
    await expect(practiceMetadata({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    state.practice = { data: { items: [{ id: "p", slug: "back" }], total: 1 }, error: null };
    expect((await practiceMetadata({ searchParams: Promise.resolve({}) })).robots).toBeUndefined();
  });

  it.each([null, {}, { items: null }, []])("rejects malformed practice payloads %j", async (data) => {
    state.practice.data = data;
    await expect(practiceMetadata({ searchParams: Promise.resolve({}) })).rejects.toThrow("Practice listing is unavailable");
  });

  it("rejects null blog data without treating it as empty", async () => {
    state.posts.data = null;
    await expect(blogMetadata({ searchParams: Promise.resolve({}) })).rejects.toThrow("Blog listing is unavailable");
  });

  it("fails explicitly when backend configuration is missing", async () => {
    state.client = false;
    await expect(blogMetadata({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    await expect(practiceMetadata({ searchParams: Promise.resolve({}) })).rejects.toThrow();
  });
});
