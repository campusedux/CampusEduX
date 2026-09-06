"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw, ListChecks, Loader2, Check, X } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { LANGUAGES, resolveLanguage, starterFor } from "@/lib/compiler/languages";
import type { NormalizedRun } from "@/lib/compiler/providers/types";
import type { JudgeCaseResult } from "@/lib/codingProblems";
import { CompilerPane } from "../../compiler/CompilerPane";

const DRAFT_PREFIX = "campusedux:coding:draft:";

interface Props {
  slug: string;
  supportedLanguages: string[];
  starterCode: Record<string, string>;
  firstExampleInput: string;
}

type RunState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "run-done"; run: NormalizedRun }
  | { phase: "judge-done"; results: JudgeCaseResult[]; summary: { passed: number; total: number }; compileError?: string }
  | { phase: "error"; message: string };

function readDraft(slug: string, langId: string): string | null {
  try {
    return window.localStorage.getItem(`${DRAFT_PREFIX}${slug}:${langId}`);
  } catch {
    return null;
  }
}
function writeDraft(slug: string, langId: string, code: string) {
  try {
    window.localStorage.setItem(`${DRAFT_PREFIX}${slug}:${langId}`, code);
  } catch {
    /* storage disabled / full — non-fatal */
  }
}

function starterForProblem(starterCode: Record<string, string>, langId: string): string {
  const lang = resolveLanguage(langId);
  const keys = [langId, ...(lang?.aliases ?? [])];
  for (const k of keys) {
    if (typeof starterCode[k] === "string" && starterCode[k].trim()) return starterCode[k];
  }
  return starterFor(langId);
}

export default function CodingProblemWorkspace({ slug, supportedLanguages, starterCode, firstExampleInput }: Props) {
  // Only languages this compiler can actually execute, in menu order.
  const languages = useMemo(() => {
    const wanted = new Set(
      (supportedLanguages.length ? supportedLanguages : ["java", "python", "c", "cpp"])
        .map((t) => resolveLanguage(t)?.id)
        .filter(Boolean) as string[],
    );
    const list = LANGUAGES.filter((l) => wanted.has(l.id));
    return list.length ? list : LANGUAGES;
  }, [supportedLanguages]);

  const [languageId, setLanguageId] = useState(languages[0].id);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState(firstExampleInput ?? "");
  const [showStdin, setShowStdin] = useState(Boolean(firstExampleInput));
  const [runState, setRunState] = useState<RunState>({ phase: "idle" });
  const [ready, setReady] = useState(false);
  const runningRef = useRef(false);

  const activeLang = useMemo(() => resolveLanguage(languageId) ?? languages[0], [languageId, languages]);

  useEffect(() => {
    const first = languages[0].id;
    setLanguageId(first);
    setCode(readDraft(slug, first) ?? starterForProblem(starterCode, first));
    setReady(true);
    // one-time init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => writeDraft(slug, languageId, code), 400);
    return () => clearTimeout(t);
  }, [code, languageId, ready, slug]);

  function switchLanguage(nextId: string) {
    if (nextId === languageId) return;
    writeDraft(slug, languageId, code);
    setLanguageId(nextId);
    setCode(readDraft(slug, nextId) ?? starterForProblem(starterCode, nextId));
    setRunState({ phase: "idle" });
  }

  function resetToStarter() {
    const starter = starterForProblem(starterCode, languageId);
    setCode(starter);
    writeDraft(slug, languageId, starter);
    setRunState({ phase: "idle" });
  }

  const run = useCallback(async () => {
    if (runningRef.current || !code.trim()) {
      if (!code.trim()) setRunState({ phase: "error", message: "Write some code first." });
      return;
    }
    runningRef.current = true;
    setRunState({ phase: "running" });
    try {
      const res = await fetch("/api/compiler/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: languageId, source: code, stdin }),
      });
      const data: { ok?: boolean; error?: string; run?: NormalizedRun } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.run) {
        setRunState({ phase: "error", message: data.error || `The compiler request failed (${res.status}).` });
        return;
      }
      setRunState({ phase: "run-done", run: data.run });
    } catch {
      setRunState({ phase: "error", message: "Network error — check your connection and try again." });
    } finally {
      runningRef.current = false;
    }
  }, [code, languageId, stdin]);

  const judge = useCallback(async () => {
    if (runningRef.current || !code.trim()) {
      if (!code.trim()) setRunState({ phase: "error", message: "Write some code first." });
      return;
    }
    runningRef.current = true;
    setRunState({ phase: "running" });
    try {
      const res = await fetch("/api/coding-problems/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, language: languageId, source: code }),
      });
      const data: {
        ok?: boolean;
        error?: string;
        results?: JudgeCaseResult[];
        summary?: { passed: number; total: number };
        compileError?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.results || !data.summary) {
        setRunState({ phase: "error", message: data.error || `Couldn't run the tests (${res.status}).` });
        return;
      }
      setRunState({
        phase: "judge-done",
        results: data.results,
        summary: data.summary,
        compileError: data.compileError,
      });
    } catch {
      setRunState({ phase: "error", message: "Network error — check your connection and try again." });
    } finally {
      runningRef.current = false;
    }
  }, [code, languageId, slug]);

  const busy = runState.phase === "running";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="cp-language" className="text-sm font-medium text-ink-muted">
          Language
        </label>
        <Select id="cp-language" value={languageId} onChange={(e) => switchLanguage(e.target.value)} className="w-36">
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" leftIcon={RotateCcw} onClick={resetToStarter} disabled={busy}>
            Reset
          </Button>
          <Button type="button" variant="ghost" leftIcon={busy ? undefined : Play} onClick={run} loading={busy}>
            Run
          </Button>
          <Button type="button" leftIcon={busy ? undefined : ListChecks} onClick={judge} loading={busy}>
            Run Tests
          </Button>
        </div>
      </div>

      <CompilerPane
        ready={ready}
        code={code}
        onChange={setCode}
        language={activeLang.prism}
        ariaLabel={`${activeLang.label} code editor`}
        onRun={judge}
        stdinOpen={showStdin}
        onStdinToggle={() => setShowStdin((v) => !v)}
        stdin={stdin}
        onStdinChange={setStdin}
        stdinLabel="Custom input (stdin) — for the Run button"
        outputHeader={<div className="text-sm font-semibold text-ink">Output</div>}
        output={<OutputBody state={runState} />}
      />
    </div>
  );
}

function OutputBody({ state }: { state: RunState }) {
  return state.phase === "idle" ? (
    <p className="text-slate-400">Run your code, or run the tests, to see results here.</p>
  ) : state.phase === "running" ? (
    <p className="flex items-center gap-2 text-slate-300">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Running…
    </p>
  ) : state.phase === "error" ? (
    <div role="alert">
      <p className="font-semibold text-red-400">Couldn&apos;t run</p>
      <p className="mt-1 whitespace-pre-wrap text-red-300">{state.message}</p>
    </div>
  ) : state.phase === "run-done" ? (
    <RunOutput run={state.run} />
  ) : (
    <JudgeOutput results={state.results} summary={state.summary} compileError={state.compileError} />
  );
}

function RunOutput({ run }: { run: NormalizedRun }) {
  if (run.timedOut) {
    return (
      <div role="alert">
        <p className="font-semibold text-amber-400">Timed out</p>
        <p className="mt-1 text-amber-200">Check for an infinite loop or blocking input.</p>
      </div>
    );
  }
  if (run.status === "compile_error") {
    return (
      <div role="alert">
        <p className="font-semibold text-red-400">Compilation error</p>
        <pre className="mt-1 whitespace-pre-wrap text-red-300">{run.compileOutput || "The compiler reported an error."}</pre>
      </div>
    );
  }
  const nothing = !run.stdout && !run.stderr;
  return (
    <div className="space-y-3">
      {run.stdout ? <pre className="whitespace-pre-wrap">{run.stdout}</pre> : null}
      {run.stderr ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-400">stderr</p>
          <pre className="mt-1 whitespace-pre-wrap text-red-300">{run.stderr}</pre>
        </div>
      ) : null}
      {nothing ? <p className="text-slate-400">Program finished with no output.</p> : null}
      <p className="border-t border-white/10 pt-2 text-xs text-slate-400">
        {run.status === "runtime_error" ? "Runtime error · " : ""}exit code {run.exitCode ?? "—"} · {run.timeMs} ms
      </p>
    </div>
  );
}

function JudgeOutput({
  results,
  summary,
  compileError,
}: {
  results: JudgeCaseResult[];
  summary: { passed: number; total: number };
  compileError?: string;
}) {
  const allPassed = summary.passed === summary.total && summary.total > 0;
  return (
    <div className="space-y-3">
      <p className={`font-semibold ${allPassed ? "text-emerald-400" : "text-amber-400"}`}>
        {allPassed ? "All tests passed" : `${summary.passed} / ${summary.total} tests passed`}
      </p>
      {compileError ? (
        <div role="alert">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Compilation error</p>
          <pre className="mt-1 whitespace-pre-wrap text-red-300">{compileError}</pre>
        </div>
      ) : null}
      <ul className="space-y-2">
        {results.map((r, i) => (
          <li key={r.seq} className="rounded-lg border border-white/10 p-2.5">
            <div className="flex items-center gap-2">
              {r.passed ? (
                <Check className="h-4 w-4 text-emerald-400" aria-hidden />
              ) : (
                <X className="h-4 w-4 text-red-400" aria-hidden />
              )}
              <span className="text-slate-300">
                {r.hidden ? `Hidden test ${i + 1}` : `Test ${i + 1}`}
                {r.note ? ` — ${r.note}` : ""}
              </span>
            </div>
            {!r.hidden && !r.passed ? (
              <div className="mt-1.5 space-y-1 text-xs">
                {r.input ? (
                  <div>
                    <span className="text-slate-500">input: </span>
                    <span className="whitespace-pre-wrap text-slate-300">{r.input}</span>
                  </div>
                ) : null}
                <div>
                  <span className="text-slate-500">expected: </span>
                  <span className="whitespace-pre-wrap text-slate-300">{r.expected}</span>
                </div>
                <div>
                  <span className="text-slate-500">got: </span>
                  <span className="whitespace-pre-wrap text-red-300">{r.actual || "(no output)"}</span>
                </div>
                {r.stderr ? <pre className="whitespace-pre-wrap text-red-300">{r.stderr}</pre> : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
