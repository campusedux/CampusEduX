jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { placementService } from "@/services/placement.service";
import { resetSupabaseMock, setTableResult, setRpcResult, supabase } from "../../mocks/supabase.mock";
import { SAMPLE_DASHBOARD } from "@/data/samplePlacementContent";

beforeEach(() => resetSupabaseMock());

describe("placementService.submitTestAttempt", () => {
  it("submits the selections to submit_test_attempt and maps the server-scored row", async () => {
    // Scoring is server-side now: the service must trust the RPC's numbers, not
    // recompute them. test_questions / practice_tests fall back to sample
    // content (5 questions) for testTitle / totalQuestions only.
    setRpcResult("submit_test_attempt", {
      data: {
        id: "att-1",
        test_id: "aptitude-test-1",
        score: 4,
        total_marks: 5,
        correct_count: 4,
        incorrect_count: 1,
        time_taken_seconds: 600,
        created_at: "2025-06-01T00:00:00.000Z",
      },
    });

    const answers = [
      { questionId: "tq-1", selectedIndex: 1 },
      { questionId: "tq-3", selectedIndex: 0 },
    ];

    const result = await placementService.submitTestAttempt("u-1", "aptitude-test-1", answers, 600);

    expect(supabase.rpc).toHaveBeenCalledWith(
      "submit_test_attempt",
      expect.objectContaining({
        p_test_id: "aptitude-test-1",
        p_answers: [
          { question_id: "tq-1", selected_index: 1 },
          { question_id: "tq-3", selected_index: 0 },
        ],
        p_time_taken_seconds: 600,
      }),
    );
    expect(result.attemptId).toBe("att-1");
    expect(result.totalQuestions).toBe(5);
    expect(result.correctCount).toBe(4);
    expect(result.incorrectCount).toBe(1);
    expect(result.score).toBe(4);
    expect(result.accuracyPercent).toBe(Math.round((4 / 5) * 100));
  });

  it("throws (never fakes a saved result) when the scoring RPC fails", async () => {
    setRpcResult("submit_test_attempt", { error: { message: "no function" } });

    await expect(
      placementService.submitTestAttempt("u-1", "aptitude-test-1", [], 10)
    ).rejects.toThrow(/Couldn't save your test result/);
  });
});

describe("placementService.getDashboardSummary", () => {
  it("aggregates attempts + solved DSA problems", async () => {
    setTableResult("test_attempts", { data: [
      { score: 8, total_marks: 10 },
      { score: 6, total_marks: 10 },
    ] });
    setTableResult("user_dsa_progress", { count: 12 });

    const summary = await placementService.getDashboardSummary("u-1");

    expect(summary.testsTaken).toBe(2);
    expect(summary.accuracyPercent).toBe(Math.round((14 / 20) * 100));
    expect(summary.questionsSolved).toBe(12 + 2 * 10);
  });

  it("returns a zeroed dashboard for a new student with no activity", async () => {
    setTableResult("test_attempts", { data: [] });
    setTableResult("user_dsa_progress", { count: 0 });

    expect(await placementService.getDashboardSummary("u-1")).toEqual({
      testsTaken: 0,
      questionsSolved: 0,
      accuracyPercent: 0,
      overallProgressPercent: 0,
    });
  });

  it("falls back to SAMPLE_DASHBOARD only when the query fails", async () => {
    setTableResult("test_attempts", { error: { message: "relation does not exist" } });

    expect(await placementService.getDashboardSummary("u-1")).toEqual(SAMPLE_DASHBOARD);
  });
});
