import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadTestAttemptReview } from "@/lib/testAttemptReview";
import { callsFor, resetSupabaseMock, setTableResult, supabase } from "../helpers/supabase.mock";

const client = supabase as unknown as SupabaseClient;
const attempt = { id: "attempt-a", test_id: "test-a", score: 1, total_marks: 2, correct_count: 1, incorrect_count: 0, time_taken_seconds: 30, created_at: "2026-10-28T00:00:00Z" };
const questions = [
  { id: "q-a", question_text: "Which value is NULL?", options: ["Unknown", "Zero", "Empty", "False"], correct_index: 0, explanation: "NULL represents missing or unknown information.", sort_order: 0 },
  { id: "q-b", question_text: "Which clause sorts results?", options: ["WHERE", "ORDER BY", "HAVING", "FROM"], correct_index: 1, explanation: "ORDER BY defines the result order.", sort_order: 1 },
];
beforeEach(() => {
  resetSupabaseMock();
  setTableResult("test_attempts", { data: attempt });
  setTableResult("test_attempt_answers", { data: [{ question_id: "q-a", selected_index: 0 }, { question_id: "q-b", selected_index: null }] });
  setTableResult("test_questions", { data: questions });
});

describe("saved attempt review", () => {
  it("loads the saved score, answers and explanations using the exact attempt and test", async () => {
    const review = await loadTestAttemptReview(client, "test-a", "attempt-a");
    expect(review?.attempt.score).toBe(1);
    expect(review?.answers[1].selected_index).toBeNull();
    expect(review?.questions[0].explanation).toContain("unknown");
    expect(callsFor("test_attempts")).toEqual(expect.arrayContaining([
      expect.objectContaining({ verb: "eq", args: ["id", "attempt-a"] }),
      expect.objectContaining({ verb: "eq", args: ["test_id", "test-a"] }),
    ]));
  });

  it("does not read answers when owner-row RLS withholds an attempt", async () => {
    setTableResult("test_attempts", { data: null });
    expect(await loadTestAttemptReview(client, "test-a", "someone-elses-attempt")).toBeNull();
    expect(callsFor("test_questions")).toHaveLength(0);
    expect(callsFor("test_attempt_answers")).toHaveLength(0);
  });

  it("rejects an attempt belonging to another test before fetching answers", async () => {
    setTableResult("test_attempts", { data: { ...attempt, test_id: "test-b" } });
    expect(await loadTestAttemptReview(client, "test-a", "attempt-a")).toBeNull();
    expect(callsFor("test_attempt_answers")).toHaveLength(0);
  });

  it("uses actual saved question IDs so randomized tests can be reviewed", async () => {
    await loadTestAttemptReview(client, "test-a", "attempt-a");
    expect(callsFor("test_questions")).toEqual(expect.arrayContaining([
      expect.objectContaining({ verb: "in", args: ["id", ["q-a", "q-b"]] }),
    ]));
    expect(callsFor("test_questions").some((call) => call.verb === "eq")).toBe(false);
  });

  it.each(["test_attempts", "test_attempt_answers", "test_questions"])("reports a %s read failure instead of showing a partial review", async (table) => {
    setTableResult(table, { error: { message: "private provider diagnostic" } });
    await expect(loadTestAttemptReview(client, "test-a", "attempt-a")).rejects.toThrow(/^Could not load/);
  });

  it("rejects incomplete question data", async () => {
    setTableResult("test_questions", { data: questions.slice(0, 1) });
    await expect(loadTestAttemptReview(client, "test-a", "attempt-a")).rejects.toThrow("answer review");
  });
});
