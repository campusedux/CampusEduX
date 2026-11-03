import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ available: true, data: [] as unknown, error: null as unknown }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("@/lib/supabase/server", () => ({ getPublicSupabase: () => state.available ? { rpc: async () => ({ data: state.data, error: state.error }) } : null }));
import { generateMetadata } from "@/app/practice/interview-questions/page";
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
    await expect(generateMetadata()).rejects.toThrow("Interview categories are unavailable");
    state.error = null;
    state.data = [{ slug: "java", name: "Java", topic_count: 2 }];
    expect(await getInterviewCategories()).toHaveLength(1);
  });
  it.each([null, {}])("rejects malformed category data %j", async data => {
    state.data = data;
    await expect(generateMetadata()).rejects.toThrow();
  });
  it("does not noindex when configuration is unavailable", async () => {
    state.available = false;
    await expect(generateMetadata()).rejects.toThrow();
  });
});
