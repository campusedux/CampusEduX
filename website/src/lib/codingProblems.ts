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
