/**
 * Practice (global coding problems, interview questions, compiler, submissions).
 * Shapes mirror website/src/lib/{practice,interviewQuestions}.types.ts and the
 * /api/compiler/run + /api/practice/{judge,submit} responses.
 */
import type { CodingProblemDetail } from "./learning.types";

export const PRACTICE_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];

export const PRACTICE_LANGUAGES = ["java", "python", "c", "cpp", "javascript"] as const;
export type PracticeLanguage = (typeof PRACTICE_LANGUAGES)[number];
export const PRACTICE_LANGUAGE_LABEL: Record<string, string> = {
  java: "Java",
  python: "Python",
  c: "C",
  cpp: "C++",
  javascript: "JavaScript",
};

export const PRACTICE_PAGE_SIZE = 24;

export interface PracticeCategory {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  problem_count: number;
}

export interface PracticeProblemCard {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category_slug: string;
  category_name: string;
  supported_languages: string[];
  is_premium: boolean;
}

export interface PracticeProblemsPage {
  total: number;
  items: PracticeProblemCard[];
}

export interface PracticeProblemsQuery {
  difficulty?: PracticeDifficulty | null;
  category?: string | null;
  q?: string | null;
}

export interface PracticeProblemDetail extends CodingProblemDetail {
  category: { slug: string; name: string };
}

export type SubmissionVerdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "error";

export interface CodingSubmissionRow {
  id: string;
  problem_slug: string;
  language: string;
  verdict: SubmissionVerdict;
  passed: number;
  total: number;
  runtime_ms: number | null;
  memory_kb: number | null;
  created_at: string;
}

export interface CodingSubmissionDetail extends CodingSubmissionRow {
  source_code: string;
}

// --- execution (website API routes) ---------------------------------------
export interface CompilerRun {
  stdout: string;
  stderr: string;
  compileOutput: string;
  exitCode: number | null;
  timedOut: boolean;
  status: "success" | "compile_error" | "runtime_error" | "timeout";
  timeMs: number;
  memoryKb?: number;
}

export interface JudgeCaseResult {
  seq: number;
  hidden: boolean;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  stderr?: string;
  note?: string;
}

export interface JudgeResponse {
  compileError?: string;
  summary: { passed: number; total: number };
  results: JudgeCaseResult[];
}

export interface SubmitResponse extends JudgeResponse {
  verdict: SubmissionVerdict;
  saved: boolean;
  submissionId: string | null;
}

// --- interview questions --------------------------------------------------
export interface InterviewCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  topic_count: number;
}

export interface InterviewTopicSummary {
  slug: string;
  name: string;
  description: string;
  question_count: number;
}

export interface InterviewTopicsPage {
  category: { slug: string; name: string; description: string };
  topics: InterviewTopicSummary[];
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  example: string;
  important_point: string;
  difficulty: PracticeDifficulty;
}

export interface InterviewTopicDetail {
  category: { slug: string; name: string };
  topic: { slug: string; name: string; description: string };
  questions: InterviewQuestion[];
  prev: { slug: string; name: string } | null;
  next: { slug: string; name: string } | null;
}
