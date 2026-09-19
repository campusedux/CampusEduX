"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";
import { LANGUAGES, resolveLanguage, starterFor } from "@/lib/compiler/languages";
import type { NormalizedRun } from "@/lib/compiler/providers/types";
import type { JudgeCaseResult } from "@/lib/codingProblems";
import { CompilerPanel } from "./_components/CompilerPanel";
import { SignInToRun } from "@/components/SignInToRun";
import { describeRunFailure } from "@/lib/runErrors";
import { useRunAccess } from "@/lib/useRunAccess";

const DRAFT_PREFIX = "campusedux:coding:draft:";

interface Props {
  slug: string;
  supportedLanguages: string[];
  starterCode: Record<string, string>;
  /** Example stdin strings from the problem, in order — seeds stdin + the "Use Example" menu. */
  exampleInputs: string[];
  /** Endpoint for "Run Tests" (visible + hidden cases, no persistence). */
  judgeEndpoint?: string;
  /** When set, a "Submit" action POSTs here and persists the attempt; a link to
   *  this path is shown after a successful submit. */
  submitEndpoint?: string;
  /** Where the "View submissions" link points after a submit. */
  submissionsHref?: string;
}

type RunState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "signin" }
  | { phase: "run-done"; run: NormalizedRun }
  | {
      phase: "judge-done";
      results: JudgeCaseResult[];
      summary: { passed: number; total: number };
      compileError?: string;
      submitted?: boolean;
      verdict?: string;
    }
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

/** kB → human string. Undefined when the provider doesn't report memory. */
function formatMemory(kb: number | undefined): string | null {
  if (typeof kb !== "number" || !Number.isFinite(kb) || kb <= 0) return null;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

/**
 * Stateful container for the coding-problem compiler: language + code + stdin +
 * draft persistence, the quick Run (`/api/compiler/run`) and Run Tests
 * (`judgeEndpoint`) calls, an optional persisted Submit (`submitEndpoint`), and
 * the result renderers. The Learning topic-practice route uses the defaults
 * (Run + Run Tests only); the global Practice route also passes `submitEndpoint`.
 */
export default function CodingProblemWorkspace({
  slug,
  supportedLanguages,
  starterCode,
  exampleInputs,
  judgeEndpoint = "/api/coding-problems/judge",
  submitEndpoint,
  submissionsHref = "/practice/submissions",
}: Props) {
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
  const [stdin, setStdin] = useState(exampleInputs[0] ?? "");
  const [runState, setRunState] = useState<RunState>({ phase: "idle" });
  const [ready, setReady] = useState(false);
  const runningRef = useRef(false);
  const { anonymous, next } = useRunAccess();

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

  const switchLanguage = useCallback(
    (nextId: string) => {
      if (nextId === languageId) return;
      writeDraft(slug, languageId, code);
      setLanguageId(nextId);
      setCode(readDraft(slug, nextId) ?? starterForProblem(starterCode, nextId));
      setRunState({ phase: "idle" });
    },
    [languageId, code, slug, starterCode],
  );

  const resetToStarter = useCallback(() => {
    const starter = starterForProblem(starterCode, languageId);
    setCode(starter);
    writeDraft(slug, languageId, starter);
    setRunState({ phase: "idle" });
  }, [starterCode, languageId, slug]);

  const clearOutput = useCallback(() => setRunState({ phase: "idle" }), []);

  const run = useCallback(async () => {
    if (anonymous) {
      setRunState({ phase: "signin" });
      return;
    }
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
        const f = describeRunFailure(res.status, data, res.headers.get("retry-after"));
        setRunState(f.kind === "auth" ? { phase: "signin" } : { phase: "error", message: f.message });
        return;
      }
      setRunState({ phase: "run-done", run: data.run });
    } catch {
      setRunState({ phase: "error", message: "Network error — check your connection and try again." });
    } finally {
      runningRef.current = false;
    }
  }, [code, languageId, stdin, anonymous]);

  const callJudge = useCallback(
    async (endpoint: string, submitted: boolean) => {
      if (anonymous) {
        setRunState({ phase: "signin" });
        return;
      }
      if (runningRef.current || !code.trim()) {
        if (!code.trim()) setRunState({ phase: "error", message: "Write some code first." });
        return;
      }
      runningRef.current = true;
      setRunState({ phase: "running" });
      try {
        const res = await fetch(endpoint, {
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
          verdict?: string;
        } = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.results || !data.summary) {
          const f = describeRunFailure(res.status, data, res.headers.get("retry-after"));
          setRunState(f.kind === "auth" ? { phase: "signin" } : { phase: "error", message: f.message });
          return;
        }
        setRunState({
          phase: "judge-done",
          results: data.results,
          summary: data.summary,
          compileError: data.compileError,
          submitted,
          verdict: data.verdict,
        });
        // A recorded submission unlocks the solution tab (ProblemSolution re-checks on this event).
        if (submitted) window.dispatchEvent(new Event("cx:submission-recorded"));
      } catch {
        setRunState({ phase: "error", message: "Network error — check your connection and try again." });
      } finally {
        runningRef.current = false;
      }
    },
    [code, languageId, slug, anonymous],
  );

  const judge = useCallback(() => callJudge(judgeEndpoint, false), [callJudge, judgeEndpoint]);
  const submit = useCallback(() => {
    if (submitEndpoint) void callJudge(submitEndpoint, true);
  }, [callJudge, submitEndpoint]);

  const busy = runState.phase === "running";

  return (
    <CompilerPanel
      ready={ready}
      languages={languages}
      languageId={languageId}
      onLanguageChange={switchLanguage}
      code={code}
      onCodeChange={setCode}
      prismLanguage={activeLang.prism}
      editorAriaLabel={`${activeLang.label} code editor`}
      stdin={stdin}
      onStdinChange={setStdin}
      exampleInputs={exampleInputs}
      onClearStdin={() => setStdin("")}
      onClearOutput={clearOutput}
      onRun={run}
      onRunTests={judge}
      onSubmit={submitEndpoint ? submit : undefined}
      onReset={resetToStarter}
      busy={busy}
      signInRequired={anonymous}
      canClearOutput={runState.phase !== "idle"}
      output={<OutputBody state={runState} submissionsHref={submissionsHref} anonymous={anonymous} next={next} />}
    />
  );
}

function OutputBody({
  state,
  submissionsHref,
  anonymous,
  next,
}: {
  state: RunState;
  submissionsHref: string;
  anonymous: boolean;
  next: string;
}) {
  return state.phase === "signin" || (anonymous && state.phase === "idle") ? (
    <SignInToRun next={next} />
  ) : state.phase === "idle" ? (
    <p className="text-slate-500">Run your code to see output here...</p>
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
    <JudgeOutput
      results={state.results}
      summary={state.summary}
      compileError={state.compileError}
      submitted={state.submitted}
      verdict={state.verdict}
      submissionsHref={submissionsHref}
    />
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
  const mem = formatMemory(run.memoryKb);
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
        {mem ? ` · ${mem}` : " · memory —"}
      </p>
    </div>
  );
}

function JudgeOutput({
  results,
  summary,
  compileError,
  submitted,
  verdict,
  submissionsHref,
}: {
  results: JudgeCaseResult[];
  summary: { passed: number; total: number };
  compileError?: string;
  submitted?: boolean;
  verdict?: string;
  submissionsHref: string;
}) {
  const allPassed = summary.passed === summary.total && summary.total > 0;
  return (
    <div className="space-y-3">
      <p className={`font-semibold ${allPassed ? "text-emerald-400" : "text-amber-400"}`}>
        {allPassed ? "All tests passed" : `${summary.passed} / ${summary.total} tests passed`}
      </p>
      {submitted ? (
        <p className="text-xs text-slate-400">
          {verdict === "accepted" ? "Accepted — " : "Submitted — "}
          saved to your{" "}
          <Link href={submissionsHref} className="font-semibold text-primary-300 hover:underline">
            submissions
          </Link>
          .
        </p>
      ) : null}
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
