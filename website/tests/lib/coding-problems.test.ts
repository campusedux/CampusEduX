import { describe, it, expect } from "vitest";
import { normalizeOutput, judgeCase, type RunCase } from "@/lib/codingProblems";
import type { NormalizedRun } from "@/lib/compiler/providers/types";

function run(partial: Partial<NormalizedRun>): NormalizedRun {
  return {
    stdout: "",
    stderr: "",
    compileOutput: "",
    exitCode: 0,
    timedOut: false,
    status: "success",
    timeMs: 5,
    ...partial,
  };
}

describe("normalizeOutput", () => {
  it("trims trailing spaces per line and trailing newlines", () => {
    expect(normalizeOutput("Hello World  \n\n")).toBe("Hello World");
    expect(normalizeOutput("a \nb\t\n")).toBe("a\nb");
  });
  it("normalises CRLF and keeps interior blank lines", () => {
    expect(normalizeOutput("a\r\n\r\nb\r\n")).toBe("a\n\nb");
  });
  it("treats null/undefined as empty", () => {
    expect(normalizeOutput(undefined as unknown as string)).toBe("");
  });
});

describe("judgeCase", () => {
  const visible: RunCase = { seq: 0, input: "2 3", expected: "5", hidden: false };
  const hidden: RunCase = { seq: 1, input: "10 20", expected: "30", hidden: true };

  it("passes when normalised stdout equals expected", () => {
    const r = judgeCase(visible, run({ stdout: "5\n" }));
    expect(r.passed).toBe(true);
    expect(r.input).toBe("2 3");
    expect(r.expected).toBe("5");
  });

  it("fails on a wrong answer and reports actual for a visible case", () => {
    const r = judgeCase(visible, run({ stdout: "6\n" }));
    expect(r.passed).toBe(false);
    expect(r.actual).toBe("6\n");
  });

  it("never leaks a hidden case's input / expected / actual", () => {
    const r = judgeCase(hidden, run({ stdout: "999\n" }));
    expect(r.passed).toBe(false);
    expect(r.hidden).toBe(true);
    expect(r.input).toBeUndefined();
    expect(r.expected).toBeUndefined();
    expect(r.actual).toBeUndefined();
  });

  it("marks a compile error as failed with a note", () => {
    const r = judgeCase(visible, run({ status: "compile_error", compileOutput: "err" }));
    expect(r.passed).toBe(false);
    expect(r.note).toBe("Compilation error");
  });

  it("marks a timeout as failed", () => {
    const r = judgeCase(visible, run({ timedOut: true, status: "timeout" }));
    expect(r.passed).toBe(false);
    expect(r.note).toBe("Timed out");
  });

  it("flags a runtime error", () => {
    const r = judgeCase(visible, run({ status: "runtime_error", stdout: "", exitCode: 1 }));
    expect(r.passed).toBe(false);
    expect(r.note).toBe("Runtime error");
  });
});
