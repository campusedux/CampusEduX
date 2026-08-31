export type AptitudeCategory = "quantitative" | "logical" | "verbal";

export interface AptitudeTopic {
  id: string;
  category: AptitudeCategory;
  name: string;
  totalQuestions: number;
  solvedQuestions: number;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks: number;
}

export type TestCategory = "aptitude" | "logical" | "verbal" | "hr" | "company";

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

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface DSATopic {
  id: string;
  name: string;
  totalProblems: number;
  solvedProblems: number;
}

export interface DSAProblemSummary {
  id: string;
  title: string;
  difficulty: Difficulty;
  isSolved: boolean;
}

export interface DSAProblemDetail {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  timeComplexity: string;
  spaceComplexity: string;
  solutionApproach: string;
  solutionCode: Record<string, string>;
  isSolved: boolean;
}

export interface CodeRunResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface JudgeCaseResult {
  input: string;
  expected: string;
  actual: string;
  stderr: string;
  passed: boolean;
}

export interface JudgeResult {
  cases: JudgeCaseResult[];
  passedCount: number;
  total: number;
  allPassed: boolean;
}

export interface HRQuestion {
  id: string;
  category: string;
  question: string;
  answerTips: string[];
  sampleAnswer: string;
  isFavorite: boolean;
}

export interface PlacementCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  questionsCount: number;
  mockTestsCount: number;
  questionsSolved: number;
}

export interface PlacementDashboardSummary {
  testsTaken: number;
  questionsSolved: number;
  accuracyPercent: number;
  overallProgressPercent: number;
}
