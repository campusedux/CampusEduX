jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { placementService } from "@/services/placement.service";
import { resetSupabaseMock, setTableResult, setRpcResult } from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

const questionRows = [
  { id: "tq-1", test_id: "aptitude-test-1", question_text: "2 + 2 = ?", options: ["3", "4", "5", "6"], correct_index: 1, explanation: "", marks: 1, sort_order: 1 },
  { id: "tq-2", test_id: "aptitude-test-1", question_text: "Capital of France?", options: ["Rome", "Paris", "Berlin", "Madrid"], correct_index: 1, explanation: "", marks: 1, sort_order: 2 },
  { id: "tq-3", test_id: "aptitude-test-1", question_text: "5 * 3 = ?", options: ["8", "15", "10", "20"], correct_index: 1, explanation: "", marks: 2, sort_order: 3 },
];

describe("integration: take a mock test end to end", () => {
  it("loads the test, its questions, scores the attempt, and reads the result back", async () => {
    // 1. test list
    setTableResult("practice_tests", {
      data: [{ id: "aptitude-test-1", title: "Aptitude Test - 01", category: "aptitude", company_id: null, question_count: 3, duration_minutes: 60, description: "" }],
    });
    const tests = await placementService.getPracticeTests({ category: "aptitude" });
    expect(tests[0].id).toBe("aptitude-test-1");

    // 2. questions
    setTableResult("test_questions", { data: questionRows });
    const questions = await placementService.getTestQuestions("aptitude-test-1");
    expect(questions).toHaveLength(3);
    expect(questions[2].marks).toBe(2);

    // 3. submit — scoring happens server-side in submit_test_attempt(); the RPC
    //    returns 2 correct (q1 m1, q3 m2 -> score 3), 1 wrong (q2), total 4.
    setTableResult("practice_tests", { data: [{ id: "aptitude-test-1", title: "Aptitude Test - 01", category: "aptitude", company_id: null, question_count: 3, duration_minutes: 60, description: "" }] });
    setTableResult("test_questions", { data: questionRows });
    setRpcResult("submit_test_attempt", {
      data: {
        id: "attempt-1",
        test_id: "aptitude-test-1",
        score: 3,
        total_marks: 4,
        correct_count: 2,
        incorrect_count: 1,
        time_taken_seconds: 420,
        created_at: "2025-06-01T00:00:00.000Z",
      },
    });

    const result = await placementService.submitTestAttempt(
      "u-1",
      "aptitude-test-1",
      [
        { questionId: "tq-1", selectedIndex: 1 },
        { questionId: "tq-2", selectedIndex: 0 },
        { questionId: "tq-3", selectedIndex: 1 },
      ],
      420
    );

    expect(result.attemptId).toBe("attempt-1");
    expect(result.correctCount).toBe(2);
    expect(result.score).toBe(3); // 1 + 2 marks
    expect(result.totalMarks).toBe(4);
    expect(result.accuracyPercent).toBe(Math.round((3 / 4) * 100));

    // 4. read the stored result back
    setTableResult("test_attempts", {
      data: [{
        id: "attempt-1",
        score: 3,
        total_marks: 4,
        correct_count: 2,
        incorrect_count: 1,
        time_taken_seconds: 420,
        created_at: "2025-06-01T00:00:00.000Z",
        test: { title: "Aptitude Test - 01" },
      }],
    });
    const stored = await placementService.getTestResult("attempt-1");
    expect(stored.testTitle).toBe("Aptitude Test - 01");
    expect(stored.accuracyPercent).toBe(75);
  });
});
