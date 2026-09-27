import { describe, it, expect, vi, beforeEach } from "vitest";

// `cache()` only exists in React's server build; `unstable_cache` is captured so the
// tags / TTL each read registers can be asserted (and the wrapped function still runs).
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));
const { registered, rpc } = vi.hoisted(() => ({
  registered: [] as { key: string[]; opts: { revalidate?: number; tags?: string[] } }[],
  rpc: vi.fn(),
}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown, key: string[], opts: { revalidate?: number; tags?: string[] }) => {
    registered.push({ key, opts });
    return fn;
  },
}));

vi.mock("@/lib/supabase/server", () => ({ getPublicSupabase: () => ({ rpc }) }));

import { getPracticeProblem, getPracticeProblemRelated } from "@/lib/practice";
import { getInterviewTopics, getInterviewTopicDetail } from "@/lib/interviewQuestions";
import { isAllowedContentTag, interviewTag, practiceTag, CONTENT_LEAF_REVALIDATE } from "@/lib/learningTags";

beforeEach(() => {
  registered.length = 0;
  rpc.mockReset();
});
const last = () => registered[registered.length - 1];

describe("content tag allowlist", () => {
  it("accepts the granular practice / interview tags and rejects look-alikes", () => {
    for (const t of [practiceTag.problem("Two-Sum"), interviewTag.category("java"), interviewTag.topic("java", "collections")]) {
      expect(isAllowedContentTag(t)).toBe(true);
    }
    expect(practiceTag.problem("Two-Sum")).toBe("practice:problem:two-sum");
    for (const t of ["practice:problem:", "practice:problem:a b", "interview:topic:java", "interview:other:x", "practice", "projects"]) {
      // `practice` (coarse) is allowed by the endpoint's own list, not by this granular check
      expect(isAllowedContentTag(t)).toBe(false);
    }
  });
});

describe("practice detail reads are tagged and never cache a failure", () => {
  it("getPracticeProblem: coarse + per-problem tag, leaf TTL, shaped result", async () => {
    rpc.mockResolvedValue({ data: { title: "Two Sum", category: { name: "Arrays" } }, error: null });
    const res = await getPracticeProblem("two-sum");
    expect(res?.topic.title).toBe("Arrays");
    expect(last().key).toEqual(["practice:problem", "two-sum"]);
    expect(last().opts).toEqual({ revalidate: CONTENT_LEAF_REVALIDATE, tags: ["practice", "practice:problem:two-sum"] });
  });

  it("getPracticeProblemRelated shares the per-problem tag", async () => {
    rpc.mockResolvedValue({ data: { related: [] }, error: null });
    await getPracticeProblemRelated("two-sum");
    expect(last().opts.tags).toEqual(["practice", "practice:problem:two-sum"]);
  });

  it("an RPC error yields the fallback (null) instead of a cached value", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    expect(await getPracticeProblem("two-sum")).toBeNull();
  });

  it("a genuine not-found is returned as null without error", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await getPracticeProblem("missing")).toBeNull();
  });
});

describe("interview reads carry category + topic tags", () => {
  it("topics list: category tag", async () => {
    rpc.mockResolvedValue({ data: { topics: [] }, error: null });
    await getInterviewTopics("Java");
    expect(last().opts.tags).toEqual(["interview-questions", "interview:category:java"]);
  });

  it("topic detail: category (prev/next siblings) and topic tags", async () => {
    rpc.mockResolvedValue({ data: { questions: [] }, error: null });
    await getInterviewTopicDetail("java", "collections");
    expect(last().key).toEqual(["interview:topic", "java", "collections"]);
    expect(last().opts.tags).toEqual(["interview-questions", "interview:category:java", "interview:topic:java:collections"]);
  });

  it("an RPC error yields null", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await getInterviewTopicDetail("java", "collections")).toBeNull();
  });
});
