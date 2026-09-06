/**
 * Types for the native mock-test-taking flow (TestInstruction → LiveTest →
 * TestResult → PerformanceAnalysis). This flow is reused by Learning topic
 * practice (a topic's Mock Test card opens `TestInstruction`); the standalone
 * placement grids that used to feed it were removed (migration 036/0064).
 */

export type TestCategory = "aptitude" | "logical" | "verbal" | "hr" | "company";

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks: number;
}

export interface PracticeTest {
  id: string;
  title: string;
  category: TestCategory;
  companyId: string | null;
  questionCount: number;
  durationMinutes: number;
  description: string;
}

export interface TestAttemptAnswer {
  questionId: string;
  selectedIndex: number | null;
}

export interface SectionScore {
  section: string;
  scorePercent: number;
}

export interface TestResult {
  attemptId: string;
  testTitle: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  accuracyPercent: number;
  timeTakenSeconds: number;
  sectionScores: SectionScore[];
  createdAt: string;
}

export interface PerformanceTrendPoint {
  label: string;
  scorePercent: number;
}

export interface PerformanceAnalysis {
  overallAccuracyPercent: number;
  testsTaken: number;
  questionsAttempted: number;
  averageScorePercent: number;
  trend: PerformanceTrendPoint[];
  sectionScores: SectionScore[];
}
