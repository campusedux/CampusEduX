jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { learningService } from "@/services/learning.service";
import { resetSupabaseMock, setRpcResult } from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

describe("learningService.listGrids", () => {
  it("returns the rows from learning_grids_list", async () => {
    setRpcResult("learning_grids_list", {
      data: [{ id: "g1", name: "Java", slug: "java", section_count: 2, topic_count: 5 }],
    });
    const grids = await learningService.listGrids();
    expect(grids).toHaveLength(1);
    expect(grids[0].slug).toBe("java");
  });

  it("returns [] when the RPC yields a non-array", async () => {
    setRpcResult("learning_grids_list", { data: null });
    expect(await learningService.listGrids()).toEqual([]);
  });

  it("throws (no silent sample fallback) when the RPC errors", async () => {
    setRpcResult("learning_grids_list", { error: { message: "boom" } });
    await expect(learningService.listGrids()).rejects.toThrow("boom");
  });
});

describe("learningService.getTopic", () => {
  it("passes the mobile platform and returns the RPC payload", async () => {
    setRpcResult("learning_topic_content", {
      data: { topic: { id: "t1", title: "Intro" }, locked: false, contents: [], prev: null, next: null },
    });
    const page = await learningService.getTopic("java", "intro");
    expect(page?.topic.title).toBe("Intro");
    expect(page?.locked).toBe(false);
  });

  it("returns null when the topic is not visible", async () => {
    setRpcResult("learning_topic_content", { data: null });
    expect(await learningService.getTopic("java", "missing")).toBeNull();
  });
});

describe("learningService.search", () => {
  it("skips the round-trip for a blank / 1-char query", async () => {
    expect(await learningService.search(" ")).toEqual([]);
  });
});

describe("learningService.getTopicPractice", () => {
  it("normalises the RPC payload to two arrays", async () => {
    setRpcResult("learning_topic_practice", {
      data: {
        mock_tests: [{ id: "mt1", title: "Quick Test" }],
        coding_problems: [{ id: "cp1", slug: "hello", title: "Hello" }],
      },
    });
    const p = await learningService.getTopicPractice("java", "intro");
    expect(p.mock_tests).toHaveLength(1);
    expect(p.coding_problems[0].slug).toBe("hello");
  });

  it("returns empty arrays when the topic has no practice", async () => {
    setRpcResult("learning_topic_practice", { data: null });
    expect(await learningService.getTopicPractice("java", "intro")).toEqual({
      mock_tests: [],
      coding_problems: [],
    });
  });

  it("throws when the RPC errors (no silent fallback)", async () => {
    setRpcResult("learning_topic_practice", { error: { message: "boom" } });
    await expect(learningService.getTopicPractice("java", "intro")).rejects.toThrow("boom");
  });
});

describe("learningService.getCodingProblem", () => {
  it("returns the RPC payload including the locked flag", async () => {
    setRpcResult("coding_problem_detail", {
      data: { problem: { slug: "hello", title: "Hello" }, topic: {}, locked: true, editorial: "" },
    });
    const d = await learningService.getCodingProblem("hello");
    expect(d?.locked).toBe(true);
    expect(d?.problem.title).toBe("Hello");
  });

  it("returns null for an unavailable problem", async () => {
    setRpcResult("coding_problem_detail", { data: null });
    expect(await learningService.getCodingProblem("nope")).toBeNull();
  });
});
