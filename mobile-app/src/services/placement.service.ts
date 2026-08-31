import { supabase } from "@/lib/supabase";
import type {
  AptitudeTopic,
  AptitudeCategory,
  PracticeTest,
  QuizQuestion,
  TestAttemptAnswer,
  TestResult,
  PerformanceAnalysis,
  DSATopic,
  DSAProblemSummary,
  DSAProblemDetail,
  CodeRunResult,
  HRQuestion,
  PlacementCompany,
  PlacementDashboardSummary,
} from "@/types";
import {
  SAMPLE_DASHBOARD,
  SAMPLE_APTITUDE_TOPICS,
  SAMPLE_PERFORMANCE,
  SAMPLE_DSA_TOPICS,
  SAMPLE_HR_QUESTIONS,
  SAMPLE_PLACEMENT_COMPANIES,
  SAMPLE_COMPANY_PERFORMANCE,
  samplePracticeTests,
  sampleTestDetail,
  sampleTestQuestions,
  sampleTestResult,
  sampleDSAProblems,
  sampleDSAProblemDetail,
  sampleFavoriteQuestions,
  sampleCompanyQuestions,
} from "@/data/samplePlacementContent";

const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
};

function mapTopicRow(row: any): AptitudeTopic {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    totalQuestions: row.total_questions ?? 0,
    solvedQuestions: row.solved_questions ?? 0,
  };
}

function mapTestRow(row: any): PracticeTest {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    companyId: row.company_id,
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

function mapHRQuestionRow(row: any, favoriteIds: Set<string>): HRQuestion {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answerTips: row.answer_tips ?? [],
    sampleAnswer: row.sample_answer ?? "",
    isFavorite: favoriteIds.has(row.id),
  };
}

/**
 * Returns `run()`'s rows, or the sample rows when the query fails.
 *
 * `fallbackWhenEmpty` (default true) keeps sample content for the shared
 * question banks (aptitude topics, practice tests, DSA, HR questions). Pass
 * `false` for per-user reads (favourites) where an empty result is correct for
 * a new student.
 */
async function orSample<T>(
  label: string,
  run: () => Promise<T[]>,
  sample: T[],
  fallbackWhenEmpty = true
): Promise<T[]> {
  try {
    const rows = await run();
    if (rows.length > 0) return rows;
    return fallbackWhenEmpty ? sample : rows;
  } catch (error) {
    console.info(`[placement.service] ${label}: using sample content (${(error as Error).message})`);
    return sample;
  }
}

/** Zeroed analytics for a student who has not attempted anything yet. */
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
  async getDashboardSummary(userId: string): Promise<PlacementDashboardSummary> {
    try {
      const { data: attempts, error } = await supabase.from("test_attempts").select("score, total_marks").eq("user_id", userId);
      if (error) throw new Error(error.message);
      const { count: solvedProblems } = await supabase
        .from("user_dsa_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "solved");

      // No "everything is 0 -> show the sample 24-tests / 75%-progress
      // dashboard" shortcut: a new student who has attempted nothing must see a
      // genuine all-zeros dashboard. The maths below naturally yields zeros.
      const testsTaken = attempts?.length ?? 0;
      const solved = solvedProblems ?? 0;
      const totalScore = (attempts ?? []).reduce((sum, a) => sum + a.score, 0);
      const totalMarks = (attempts ?? []).reduce((sum, a) => sum + a.total_marks, 0);
      const accuracyPercent = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
      return {
        testsTaken,
        questionsSolved: solved + testsTaken * 10,
        accuracyPercent,
        overallProgressPercent: Math.min(100, Math.round(testsTaken * 8 + solved * 2)),
      };
    } catch (error) {
      console.info(`[placement.service] getDashboardSummary: using sample content (${(error as Error).message})`);
      return SAMPLE_DASHBOARD;
    }
  },

  async getAptitudeTopics(category: AptitudeCategory): Promise<AptitudeTopic[]> {
    return orSample(
      "getAptitudeTopics",
      async () => {
        const { data, error } = await supabase.from("aptitude_topics").select("*").eq("category", category).order("name");
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapTopicRow);
      },
      SAMPLE_APTITUDE_TOPICS[category]
    );
  },

  async getPracticeTests(filters: { category?: string; companyId?: string } = {}): Promise<PracticeTest[]> {
    return orSample(
      "getPracticeTests",
      async () => {
        let query = supabase.from("practice_tests").select("*").order("created_at", { ascending: false });
        if (filters.category) query = query.eq("category", filters.category);
        if (filters.companyId) query = query.eq("company_id", filters.companyId);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapTestRow);
      },
      samplePracticeTests(filters)
    );
  },

  async getTestDetail(testId: string): Promise<PracticeTest> {
    try {
      const { data, error } = await supabase.from("practice_tests").select("*").eq("id", testId).single();
      if (error || !data) throw new Error("Test not found.");
      return mapTestRow(data);
    } catch (error) {
      console.info(`[placement.service] getTestDetail: using sample content (${(error as Error).message})`);
      return sampleTestDetail(testId);
    }
  },

  async getTestQuestions(testId: string): Promise<QuizQuestion[]> {
    return orSample(
      "getTestQuestions",
      async () => {
        const { data, error } = await supabase.from("test_questions").select("*").eq("test_id", testId).order("sort_order");
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapQuestionRow);
      },
      sampleTestQuestions()
    );
  },

  async submitTestAttempt(
    userId: string,
    testId: string,
    answers: TestAttemptAnswer[],
    timeTakenSeconds: number
  ): Promise<TestResult> {
    const questions = await placementService.getTestQuestions(testId);
    const test = await placementService.getTestDetail(testId);

    // Scoring is done server-side (migration 0040): submit_test_attempt()
    // recomputes score / counts from the answer key, so a client can't POST a
    // forged result into the dashboards, analytics and leaderboards. The
    // client-sent selections are the only thing trusted.
    const { data: attempt, error: attemptError } = await supabase.rpc("submit_test_attempt", {
      p_test_id: testId,
      p_answers: answers.map((a) => ({
        question_id: a.questionId,
        selected_index: a.selectedIndex,
      })),
      p_time_taken_seconds: timeTakenSeconds,
    });
    if (attemptError || !attempt) {
      throw new Error(
        `Couldn't save your test result: ${attemptError?.message ?? "please try again."}`,
      );
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
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("*, test:practice_tests(title)")
        .eq("id", attemptId)
        .single();
      if (error || !data) throw new Error("Result not found.");
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
    } catch (error) {
      console.info(`[placement.service] getTestResult: using sample content (${(error as Error).message})`);
      return sampleTestResult(attemptId);
    }
  },

  async getPerformanceAnalysis(userId: string): Promise<PerformanceAnalysis> {
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("score, total_marks, created_at, test:practice_tests(title, category)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return EMPTY_PERFORMANCE;
      return buildPerformance(data);
    } catch (error) {
      console.info(`[placement.service] getPerformanceAnalysis: using sample content (${(error as Error).message})`);
      return SAMPLE_PERFORMANCE;
    }
  },

  async getDSATopics(userId?: string): Promise<DSATopic[]> {
    return orSample(
      "getDSATopics",
      async () => {
        const { data: topics, error } = await supabase.from("dsa_topics").select("*, problems:dsa_problems(id)").order("sort_order");
        if (error) throw new Error(error.message);

        let solvedIds = new Set<string>();
        if (userId) {
          const { data: progress } = await supabase.from("user_dsa_progress").select("problem_id").eq("user_id", userId).eq("status", "solved");
          solvedIds = new Set((progress ?? []).map((p) => p.problem_id));
        }

        return (topics ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          totalProblems: row.problems?.length ?? 0,
          solvedProblems: (row.problems ?? []).filter((p: any) => solvedIds.has(p.id)).length,
        }));
      },
      SAMPLE_DSA_TOPICS
    );
  },

  async getDSAProblems(topicId: string, userId?: string): Promise<DSAProblemSummary[]> {
    return orSample(
      "getDSAProblems",
      async () => {
        const { data, error } = await supabase.from("dsa_problems").select("id, title, difficulty").eq("topic_id", topicId).order("sort_order");
        if (error) throw new Error(error.message);

        let solvedIds = new Set<string>();
        if (userId) {
          const { data: progress } = await supabase.from("user_dsa_progress").select("problem_id").eq("user_id", userId).eq("status", "solved");
          solvedIds = new Set((progress ?? []).map((p) => p.problem_id));
        }
        return (data ?? []).map((row) => ({ id: row.id, title: row.title, difficulty: row.difficulty, isSolved: solvedIds.has(row.id) }));
      },
      sampleDSAProblems()
    );
  },

  async getDSAProblemDetail(problemId: string, userId?: string): Promise<DSAProblemDetail> {
    try {
      const { data, error } = await supabase.from("dsa_problems").select("*").eq("id", problemId).single();
      if (error || !data) throw new Error("Problem not found.");

      let isSolved = false;
      if (userId) {
        const { data: progress } = await supabase
          .from("user_dsa_progress")
          .select("status")
          .eq("user_id", userId)
          .eq("problem_id", problemId)
          .maybeSingle();
        isSolved = progress?.status === "solved";
      }

      return {
        id: data.id,
        title: data.title,
        difficulty: data.difficulty,
        description: data.description,
        examples: data.examples ?? [],
        constraints: data.constraints ?? [],
        starterCode: data.starter_code ?? {},
        timeComplexity: data.time_complexity ?? "",
        spaceComplexity: data.space_complexity ?? "",
        solutionApproach: data.solution_approach ?? "",
        solutionCode: data.solution_code ?? {},
        isSolved,
      };
    } catch (error) {
      console.info(`[placement.service] getDSAProblemDetail: using sample content (${(error as Error).message})`);
      return sampleDSAProblemDetail(problemId);
    }
  },

  /**
   * Runs user code against the free Piston execution API
   * (https://github.com/engineer-man/piston) — real code execution, no
   * infra of our own required. `stdin` carries the problem's test input.
   */
  async runCode(language: string, code: string, stdin = ""): Promise<CodeRunResult> {
    const runtime = PISTON_LANGUAGE_MAP[language] ?? PISTON_LANGUAGE_MAP.python;
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
        stdin,
      }),
    });

    if (!response.ok) throw new Error("Code execution service is unavailable right now.");
    const result = await response.json();
    const stdout = result.run?.stdout ?? "";
    const stderr = result.run?.stderr ?? result.compile?.stderr ?? "";
    return { stdout, stderr, success: !stderr && (result.run?.code ?? 0) === 0 };
  },

  /**
   * Runs the submission against EVERY provided test case. "Accepted" requires
   * all of them to pass — never just the first sample.
   */
  async judgeSolution(
    language: string,
    code: string,
    cases: { input: string; output: string }[]
  ): Promise<import("@/types").JudgeResult> {
    const list = cases.length ? cases : [{ input: "", output: "" }];
    const results: import("@/types").JudgeCaseResult[] = [];

    for (let i = 0; i < list.length; i++) {
      const tc = list[i];
      const run = await placementService.runCode(language, code, tc.input ?? "");
      const actual = (run.stdout ?? "").trim();
      const expected = (tc.output ?? "").trim();
      results.push({
        input: tc.input ?? "",
        expected,
        actual,
        stderr: run.stderr ?? "",
        passed: !run.stderr && actual === expected,
      });
      // Be gentle with the public Piston rate limit between cases.
      if (i < list.length - 1) await new Promise((r) => setTimeout(r, 250));
    }

    const passedCount = results.filter((r) => r.passed).length;
    return {
      cases: results,
      passedCount,
      total: results.length,
      allPassed: passedCount === results.length,
    };
  },

  async markProblemSolved(userId: string, problemId: string): Promise<void> {
    if (!userId) throw new Error("You need to be signed in to save your progress.");
    const { error } = await supabase
      .from("user_dsa_progress")
      .upsert({ user_id: userId, problem_id: problemId, status: "solved", solved_at: new Date().toISOString() });
    if (error) {
      // Table not migrated yet is the one case we tolerate silently.
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.info(`[placement.service] markProblemSolved: table missing (${error.message})`);
        return;
      }
      throw new Error(`Couldn't save your progress: ${error.message}`);
    }
  },

  async getHRQuestions(userId?: string, category?: string): Promise<HRQuestion[]> {
    return orSample(
      "getHRQuestions",
      async () => {
        let query = supabase.from("hr_questions").select("*").is("company_id", null).order("category");
        if (category) query = query.eq("category", category);
        const { data, error } = await query;
        if (error) throw new Error(error.message);

        let favoriteIds = new Set<string>();
        if (userId) {
          const { data: favs } = await supabase.from("user_favorite_questions").select("question_id").eq("user_id", userId);
          favoriteIds = new Set((favs ?? []).map((f) => f.question_id));
        }
        return (data ?? []).map((row) => mapHRQuestionRow(row, favoriteIds));
      },
      category ? SAMPLE_HR_QUESTIONS.filter((q) => q.category === category) : SAMPLE_HR_QUESTIONS
    );
  },

  async toggleFavoriteQuestion(userId: string, questionId: string, isCurrentlyFavorite: boolean): Promise<void> {
    try {
      if (isCurrentlyFavorite) {
        const { error } = await supabase.from("user_favorite_questions").delete().eq("user_id", userId).eq("question_id", questionId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("user_favorite_questions").insert({ user_id: userId, question_id: questionId });
        if (error) throw new Error(error.message);
      }
    } catch (error) {
      console.info(`[placement.service] toggleFavoriteQuestion: not persisted (${(error as Error).message})`);
    }
  },

  async getFavoriteQuestions(userId: string): Promise<HRQuestion[]> {
    return orSample(
      "getFavoriteQuestions",
      async () => {
        const { data, error } = await supabase
          .from("user_favorite_questions")
          .select("question:hr_questions(*)")
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
        const favoriteIds = new Set((data ?? []).map((row: any) => row.question?.id).filter(Boolean));
        return (data ?? []).filter((row: any) => row.question).map((row: any) => mapHRQuestionRow(row.question, favoriteIds));
      },
      sampleFavoriteQuestions(),
      false
    );
  },

  async getCompanies(userId?: string): Promise<PlacementCompany[]> {
    return orSample(
      "getCompanies",
      async () => {
        const { data, error } = await supabase
          .from("companies")
          .select("id, name, logo_url, hr_questions(count), practice_tests(count)")
          .order("name");
        if (error) throw new Error(error.message);

        const solvedByCompany = new Map<string, number>();
        if (userId) {
          const { data: favSolved } = await supabase
            .from("user_favorite_questions")
            .select("question:hr_questions(company_id)")
            .eq("user_id", userId);
          (favSolved ?? []).forEach((row: any) => {
            const companyId = row.question?.company_id;
            if (companyId) solvedByCompany.set(companyId, (solvedByCompany.get(companyId) ?? 0) + 1);
          });
        }

        return (data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          logoUrl: row.logo_url,
          questionsCount: row.hr_questions?.[0]?.count ?? 0,
          mockTestsCount: row.practice_tests?.[0]?.count ?? 0,
          questionsSolved: solvedByCompany.get(row.id) ?? 0,
        }));
      },
      SAMPLE_PLACEMENT_COMPANIES
    );
  },

  async getCompanyQuestions(companyId: string, userId?: string): Promise<HRQuestion[]> {
    return orSample(
      "getCompanyQuestions",
      async () => {
        const { data, error } = await supabase.from("hr_questions").select("*").eq("company_id", companyId);
        if (error) throw new Error(error.message);

        let favoriteIds = new Set<string>();
        if (userId) {
          const { data: favs } = await supabase.from("user_favorite_questions").select("question_id").eq("user_id", userId);
          favoriteIds = new Set((favs ?? []).map((f) => f.question_id));
        }
        return (data ?? []).map((row) => mapHRQuestionRow(row, favoriteIds));
      },
      sampleCompanyQuestions(companyId)
    );
  },

  /**
   * Same shape as getPerformanceAnalysis but scoped to a single company's
   * mock tests — powers CompanyAnalyticsScreen (Module 5, screen 24).
   */
  async getCompanyPerformance(userId: string, companyId: string): Promise<PerformanceAnalysis> {
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("score, total_marks, created_at, test:practice_tests!inner(title, category, company_id)")
        .eq("user_id", userId)
        .eq("test.company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return EMPTY_PERFORMANCE;
      return buildPerformance(data);
    } catch (error) {
      console.info(`[placement.service] getCompanyPerformance: using sample content (${(error as Error).message})`);
      return SAMPLE_COMPANY_PERFORMANCE;
    }
  },
};
