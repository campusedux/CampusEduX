import { supabase } from "@/lib/supabase";
import type {
  PracticeTest,
  QuizQuestion,
  TestAttemptAnswer,
  TestResult,
  PerformanceAnalysis,
} from "@/types";

/**
 * Data layer for the native mock-test-taking flow (TestInstruction → LiveTest →
 * TestResult → PerformanceAnalysis), reused by Learning topic practice. Reads
 * the shared `practice_tests` / `test_questions` / `test_attempts` tables;
 * scoring is server-side via `submit_test_attempt()` (migration 0040). On
 * failure these throw — there is no sample-data fallback.
 */

function mapTestRow(row: any): PracticeTest {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    companyId: row.company_id ?? null,
    questionCount: row.question_count ?? 0,
    durationMinutes: row.duration_minutes ?? 0,
    description: row.description ?? "",
  };
}

function mapQuestionRow(row: any): QuizQuestion {
  return {
    id: row.id,
    questionText: row.question_text,
    options: row.options ?? [],
    correctIndex: row.correct_index,
    explanation: row.explanation ?? "",
    marks: row.marks ?? 1,
  };
}

const EMPTY_PERFORMANCE: PerformanceAnalysis = {
  overallAccuracyPercent: 0,
  testsTaken: 0,
  questionsAttempted: 0,
  averageScorePercent: 0,
  trend: [],
  sectionScores: [],
};

function trendAverage(trend: PerformanceAnalysis["trend"]) {
  return trend.length > 0 ? Math.round(trend.reduce((s, t) => s + t.scorePercent, 0) / trend.length) : 0;
}

function buildPerformance(attempts: any[]): PerformanceAnalysis {
  const trend = attempts.slice(-6).map((a: any, index: number) => ({
    label: `Test ${index + 1}`,
    scorePercent: a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0,
  }));
  const byCategory = new Map<string, { score: number; total: number }>();
  attempts.forEach((a: any) => {
    const cat = a.test?.category ?? "Overall";
    const bucket = byCategory.get(cat) ?? { score: 0, total: 0 };
    bucket.score += a.score;
    bucket.total += a.total_marks;
    byCategory.set(cat, bucket);
  });
  const sectionScores = Array.from(byCategory.entries()).map(([section, { score, total }]) => ({
    section,
    scorePercent: total > 0 ? Math.round((score / total) * 100) : 0,
  }));
  const totalScore = attempts.reduce((sum: number, a: any) => sum + a.score, 0);
  const totalMarks = attempts.reduce((sum: number, a: any) => sum + a.total_marks, 0);
  return {
    overallAccuracyPercent: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0,
    testsTaken: attempts.length,
    questionsAttempted: attempts.length * 10,
    averageScorePercent: trendAverage(trend),
    trend,
    sectionScores,
  };
}

export const placementService = {
  async getTestDetail(testId: string): Promise<PracticeTest> {
    const { data, error } = await supabase.from("practice_tests").select("*").eq("id", testId).single();
    if (error || !data) throw new Error(error?.message ?? "Test not found.");
    return mapTestRow(data);
  },

  async getTestQuestions(testId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from("test_questions")
      .select("*")
      .eq("test_id", testId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapQuestionRow);
  },

  async submitTestAttempt(
    _userId: string,
    testId: string,
    answers: TestAttemptAnswer[],
    timeTakenSeconds: number,
  ): Promise<TestResult> {
    const questions = await placementService.getTestQuestions(testId);
    const test = await placementService.getTestDetail(testId);

    // Scoring is done server-side (migration 0040): submit_test_attempt()
    // recomputes score / counts from the answer key, so a client can't POST a
    // forged result into the analytics. The client-sent selections are the only
    // thing trusted.
    const { data: attempt, error: attemptError } = await supabase.rpc("submit_test_attempt", {
      p_test_id: testId,
      p_answers: answers.map((a) => ({ question_id: a.questionId, selected_index: a.selectedIndex })),
      p_time_taken_seconds: timeTakenSeconds,
    });
    if (attemptError || !attempt) {
      throw new Error(`Couldn't save your test result: ${attemptError?.message ?? "please try again."}`);
    }

    const totalMarks = attempt.total_marks ?? 0;
    const accuracyPercent = totalMarks > 0 ? Math.round((attempt.score / totalMarks) * 100) : 0;
    return {
      attemptId: attempt.id,
      testTitle: test.title,
      score: attempt.score ?? 0,
      totalMarks,
      correctCount: attempt.correct_count ?? 0,
      incorrectCount: attempt.incorrect_count ?? 0,
      totalQuestions: questions.length,
      accuracyPercent,
      timeTakenSeconds: attempt.time_taken_seconds ?? timeTakenSeconds,
      sectionScores: [{ section: test.title, scorePercent: accuracyPercent }],
      createdAt: attempt.created_at,
    };
  },

  async getTestResult(attemptId: string): Promise<TestResult> {
    const { data, error } = await supabase
      .from("test_attempts")
      .select("*, test:practice_tests(title)")
      .eq("id", attemptId)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Result not found.");
    const accuracyPercent = data.total_marks > 0 ? Math.round((data.score / data.total_marks) * 100) : 0;
    return {
      attemptId: data.id,
      testTitle: data.test?.title ?? "",
      score: data.score,
      totalMarks: data.total_marks,
      correctCount: data.correct_count,
      incorrectCount: data.incorrect_count,
      totalQuestions: data.correct_count + data.incorrect_count,
      accuracyPercent,
      timeTakenSeconds: data.time_taken_seconds,
      sectionScores: [{ section: data.test?.title ?? "Overall", scorePercent: accuracyPercent }],
      createdAt: data.created_at,
    };
  },

  async getPerformanceAnalysis(userId: string): Promise<PerformanceAnalysis> {
    const { data, error } = await supabase
      .from("test_attempts")
      .select("score, total_marks, created_at, test:practice_tests(title, category)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return EMPTY_PERFORMANCE;
    return buildPerformance(data);
  },
};
