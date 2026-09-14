import type { NormalizedRun } from "@/lib/compiler/providers/types";

/**
 * Pure helpers for judging a Coding Problem submission on the website. The
 * hidden test cases live only in Postgres (`dsa_problems.test_cases`) and are
 * read server-side by `coding_problem_run_cases()`; the API route strips a
 * hidden case's input/expected from its HTTP response — see
 * `src/app/api/coding-problems/judge/route.ts`.
 */

/** A judge case as returned by the `coding_problem_run_cases` RPC. */
export interface RunCase {
  seq: number;
  input: string;
  expected: string;
  hidden: boolean;
  /** SQL problems only — schema DDL / seed data / trailing check query to
   *  compose around the student's submitted query. Empty for every other
   *  language. See `composeSubmissionSource`. */
  schema_sql?: string;
  seed_sql?: string;
  check_sql?: string;
}

/**
 * The actual program sent to the execution provider for one case. Every
 * language runs the student's source verbatim — EXCEPT `sql`, whose problems
 * don't hand the student a full program: the case supplies the schema +
 * seed data (and an optional trailing check query) that must run around
 * whatever query the student wrote, in that order.
 */
export function composeSubmissionSource(languageId: string, studentSource: string, c: Pick<RunCase, "schema_sql" | "seed_sql" | "check_sql">): string {
  if (languageId !== "sql") return studentSource;
  return [c.schema_sql, c.seed_sql, studentSource, c.check_sql].filter((part) => part && part.trim()).join(";\n");
}

/** One case's result, ready to send to the browser (redacted for hidden cases). */
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

/** Normalise program output for comparison: strip trailing spaces per line and
 *  drop trailing blank lines / the final newline. Whitespace-only lines inside
 *  the output are kept. */
export function normalizeOutput(s: string): string {
  return (s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

/** Judge one already-executed case. Compile / runtime / timeout failures fail
 *  the case with an explanatory note. */
export function judgeCase(c: RunCase, run: NormalizedRun): JudgeCaseResult {
  const base: JudgeCaseResult = { seq: c.seq, hidden: c.hidden, passed: false };
  if (!c.hidden) {
    base.input = c.input;
    base.expected = c.expected;
  }

  if (run.timedOut || run.status === "timeout") {
    return { ...base, note: "Timed out", ...(c.hidden ? {} : { actual: "" }) };
  }
  if (run.status === "compile_error") {
    return { ...base, note: "Compilation error", ...(c.hidden ? {} : { actual: "" }) };
  }

  const actual = normalizeOutput(run.stdout);
  const passed = run.status === "success" && actual === normalizeOutput(c.expected);
  return {
    ...base,
    passed,
    ...(c.hidden ? {} : { actual: run.stdout, stderr: run.stderr || undefined }),
    ...(!passed && run.status === "runtime_error" ? { note: "Runtime error" } : {}),
  };
}

/** The maximum number of test cases the judge route will execute per request. */
export const MAX_JUDGE_CASES = 12;
