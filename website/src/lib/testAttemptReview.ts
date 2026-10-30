import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReviewQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  sort_order: number;
}

export interface AttemptReview {
  attempt: {
    id: string;
    test_id: string;
    score: number;
    total_marks: number;
    correct_count: number;
    incorrect_count: number;
    time_taken_seconds: number;
    created_at: string;
  };
  questions: ReviewQuestion[];
  answers: { question_id: string; selected_index: number | null }[];
}

/** Uses the caller's existing session and owner-row RLS, never a privileged client.
 * Question IDs come from the saved attempt, including randomized course tests.
 */
export async function loadTestAttemptReview(
  supabase: SupabaseClient,
  testId: string,
  attemptId: string,
): Promise<AttemptReview | null> {
  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("id,test_id,score,total_marks,correct_count,incorrect_count,time_taken_seconds,created_at")
    .eq("id", attemptId)
    .eq("test_id", testId)
    .maybeSingle();
  if (attemptError) throw new Error("Could not load the saved result.");
  if (!attempt || attempt.test_id !== testId) return null;

  const { data: answers, error: answerError } = await supabase
    .from("test_attempt_answers")
    .select("question_id,selected_index")
    .eq("attempt_id", attempt.id);
  if (answerError || !answers?.length) throw new Error("Could not load the saved answers.");
  const ids = answers.map((answer) => answer.question_id as string);
  const { data: questions, error: questionError } = await supabase
    .from("test_questions")
    .select("id,question_text,options,correct_index,explanation,sort_order")
    .in("id", ids)
    .order("sort_order", { ascending: true });
  if (questionError || !questions || questions.length !== new Set(ids).size) {
    throw new Error("Could not load the answer review.");
  }
  return { attempt, questions, answers } as AttemptReview;
}
