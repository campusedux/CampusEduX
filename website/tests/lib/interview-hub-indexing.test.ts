import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ available: true, data: [] as unknown, error: null as unknown }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("@/lib/supabase/server", () => ({ getPublicSupabase: () => state.available ? { rpc: async () => ({ data: state.data, error: state.error }) } : null }));
import HubPage, { generateMetadata } from "@/app/practice/interview-questions/page";
import { getInterviewCategories } from "@/lib/interviewQuestions";
beforeEach(() => { state.available = true; state.data = []; state.error = null; });
describe("interview hub indexing", () => {
  it("noindexes a genuinely empty catalog and recovers when content exists", async () => {
    expect((await generateMetadata()).robots).toEqual({ index: false, follow: true });
    state.data = [{ slug: "java", name: "Java", topic_count: 2 }];
    expect((await generateMetadata()).robots).toBeUndefined();
  });
  it("does not convert an unavailable catalog into cacheable empty content", async () => {
    state.error = { message: "temporarily unavailable" };
    expect((await generateMetadata()).robots).toBeUndefined();
    await expect(HubPage()).rejects.toThrow("Interview categories are unavailable");
    state.error = null;
    state.data = [{ slug: "java", name: "Java", topic_count: 2 }];
    expect(await getInterviewCategories()).toHaveLength(1);
  });
  it.each([null, {}])("rejects malformed category data %j", async data => {
    state.data = data;
    expect((await generateMetadata()).robots).toBeUndefined();
    await expect(HubPage()).rejects.toThrow();
  });
  it("does not noindex when configuration is unavailable", async () => {
    state.available = false;
    expect((await generateMetadata()).robots).toBeUndefined();
    await expect(HubPage()).rejects.toThrow();
  });
});

describe("interview category availability", () => {
  it("noindexes confirmed-empty topics and preserves indexability on failure", async () => {
    const { generateMetadata: categoryMetadata, default: CategoryPage } = await import("@/app/practice/interview-questions/[category]/page");
    const args = { params: Promise.resolve({ category: "java" }) };
    state.data = { category: { slug: "java", name: "Java", description: "Programming" }, topics: [] };
    expect((await categoryMetadata(args)).robots).toEqual({ index: false, follow: true });
    state.error = { message: "synthetic timeout" };
    expect((await categoryMetadata(args)).robots).toBeUndefined();
    await expect(CategoryPage(args)).rejects.toThrow();
    state.error = null;
    state.available = false;
    expect((await categoryMetadata(args)).robots).toBeUndefined();
    await expect(CategoryPage(args)).rejects.toThrow();
  });
});
