"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  LANGUAGES,
  DEFAULT_LANGUAGE_ID,
  resolveLanguage,
  starterFor,
} from "@/lib/compiler/languages";
import { DRAFT_STORAGE_PREFIX, HANDOFF_STORAGE_KEY } from "@/lib/compiler/handoff";
import {
  loadCompilerEditorTheme,
  saveCompilerEditorTheme,
  type CompilerEditorTheme,
} from "@/lib/compiler/standaloneLayout";
import type { NormalizedRun } from "@/lib/compiler/providers/types";
import type { CursorPosition } from "./CodeEditor";
import { CompilerShell } from "./CompilerShell";
import { CompilerToolbar } from "./CompilerToolbar";
import { RuntimeErrorCard } from "./RuntimeErrorCard";
import { SignInToRun } from "@/components/SignInToRun";
import { describeRunFailure } from "@/lib/runErrors";
import { useRunAccess } from "@/lib/useRunAccess";

const LANG_STORAGE_KEY = "campusedux:compiler:lang";
const FONT_STORAGE_KEY = "campusedux:compiler:fontsize";

const FONT_MIN = 11;
const FONT_MAX = 22;
const FONT_DEFAULT = 14;

type RunState =
  | { phase: "idle" }
  | { phase: "running" }
  | { phase: "signin" }
  | { phase: "done"; run: NormalizedRun; hadEmptyStdin: boolean }
  | { phase: "error"; message: string };

function readDraft(langId: string): string | null {
  try {
    return window.localStorage.getItem(DRAFT_STORAGE_PREFIX + langId);
  } catch {
    return null;
  }
}
function writeDraft(langId: string, code: string) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_PREFIX + langId, code);
  } catch {
    /* storage disabled / full — non-fatal */
  }
}
function clampFont(n: number): number {
  return Math.min(FONT_MAX, Math.max(FONT_MIN, n));
}

export default function CompilerWorkspace({ requireAuth = true }: { requireAuth?: boolean } = {}) {
  const searchParams = useSearchParams();
  const { anonymous, next } = useRunAccess(requireAuth);
  const anonymousRef = useRef(false);
  anonymousRef.current = anonymous;

  const [languageId, setLanguageId] = useState<string>(DEFAULT_LANGUAGE_ID);
  const [code, setCode] = useState<string>("");
  const [stdin, setStdin] = useState<string>("");
  const [runState, setRunState] = useState<RunState>({ phase: "idle" });
  const [ready, setReady] = useState(false);

  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [fullscreen, setFullscreen] = useState(false);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [editorTheme, setEditorTheme] = useState<CompilerEditorTheme>("dark");

  const activeLang = useMemo(
    () => resolveLanguage(languageId) ?? LANGUAGES[0],
    [languageId],
  );
  const runningRef = useRef(false);

  const doRun = useCallback(
    async (source: string, lang: string, input: string) => {
      if (runningRef.current) return;
      if (anonymousRef.current) {
        setRunState({ phase: "signin" });
        return;
      }
      if (!source.trim()) {
        setRunState({ phase: "error", message: "Write some code first." });
        return;
      }
      runningRef.current = true;
      setRunState({ phase: "running" });
      try {
        const res = await fetch("/api/compiler/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ language: lang, source, stdin: input }),
        });
        let data: { ok?: boolean; error?: string; run?: NormalizedRun } = {};
        try {
          data = await res.json();
        } catch {
          /* handled below */
        }
        if (!res.ok || !data.ok || !data.run) {
          const failure = describeRunFailure(res.status, data, res.headers.get("retry-after"));
          setRunState(failure.kind === "auth" ? { phase: "signin" } : { phase: "error", message: failure.message });
          return;
        }
        const hadEmptyStdin = !input.trim();
        setRunState({ phase: "done", run: data.run, hadEmptyStdin });
      } catch {
        setRunState({
          phase: "error",
          message: "Network error — check your connection and try again.",
        });
      } finally {
        runningRef.current = false;
      }
    },
    [],
  );

  // ---- one-time init from the URL / storage --------------------------------
  useEffect(() => {
    const qpLang = resolveLanguage(searchParams.get("language"))?.id;
    let storedLang: string | null = null;
    let storedFont: string | null = null;
    try {
      storedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
      storedFont = window.localStorage.getItem(FONT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const initialLang = qpLang || resolveLanguage(storedLang)?.id || DEFAULT_LANGUAGE_ID;
    const parsedFont = storedFont ? Number.parseInt(storedFont, 10) : NaN;
    if (Number.isFinite(parsedFont)) setFontSize(clampFont(parsedFont));
    setEditorTheme(loadCompilerEditorTheme());

    let initialCode = "";
    let usedHandoff = false;
    if (searchParams.get("from") === "handoff") {
      try {
        const raw = window.sessionStorage.getItem(HANDOFF_STORAGE_KEY);
        window.sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { language?: string; code?: string };
          if (typeof parsed.code === "string" && parsed.code.length > 0) {
            initialCode = parsed.code;
            usedHandoff = true;
          }
        }
      } catch {
        /* ignore malformed handoff */
      }
    }
    if (!usedHandoff) {
      const qpCode = searchParams.get("code");
      if (qpCode && qpCode.length > 0) initialCode = qpCode;
    }
    if (!initialCode) initialCode = readDraft(initialLang) ?? starterFor(initialLang);

    setLanguageId(initialLang);
    setCode(initialCode);
    setReady(true);

    if (searchParams.get("autorun") === "1" && initialCode.trim()) {
      void doRun(initialCode, initialLang, "");
    }
    // Deep-link params are read once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- autosave the current buffer as this language's draft ---------------
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => writeDraft(languageId, code), 400);
    return () => clearTimeout(t);
  }, [code, languageId, ready]);

  // ---- fullscreen: lock page scroll, allow Escape to exit ------------------
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen]);

  function switchLanguage(nextId: string) {
    if (nextId === languageId) return;
    writeDraft(languageId, code); // keep what the user was working on
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextId);
    } catch {
      /* ignore */
    }
    setLanguageId(nextId);
    setCode(readDraft(nextId) ?? starterFor(nextId));
    setRunState({ phase: "idle" });
  }

  function resetToStarter() {
    const starter = starterFor(languageId);
    setCode(starter);
    writeDraft(languageId, starter);
    setRunState({ phase: "idle" });
  }

  function adjustFontSize(delta: number) {
    setFontSize((prev) => {
      const next = clampFont(prev + delta);
      try {
        window.localStorage.setItem(FONT_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function toggleTheme() {
    setEditorTheme((t) => {
      const next: CompilerEditorTheme = t === "dark" ? "light" : "dark";
      saveCompilerEditorTheme(next);
      return next;
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  }

  function downloadCode() {
    try {
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeLang.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* non-fatal */
    }
  }

  async function copyOutput() {
    if (runState.phase !== "done") return;
    const text = runState.run.stdout || runState.run.stderr || runState.run.compileOutput || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 1500);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
  }

  const running = runState.phase === "running";
  const runNow = () => doRun(code, languageId, stdin);

  const statusLeft = `Ln ${cursor.line}, Col ${cursor.column} · ${code.length.toLocaleString()} chars · ${activeLang.label}${
    runState.phase === "done" ? ` · ${runState.run.timeMs} ms` : ""
  }`;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[60] flex flex-col bg-[#0b1120] p-2 sm:p-3"
          : "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"
      }
    >
      {!fullscreen ? (
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1 text-sm text-ink-faint"
        >
          <Link href="/practice" className="hover:text-ink">
            Practice
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-ink-muted">Online Compiler</span>
        </nav>
      ) : null}

      <CompilerShell
        bare={fullscreen}
        className={fullscreen ? "flex-1" : "lg:h-[calc(100vh-11rem)] lg:min-h-[600px]"}
        toolbar={
          <CompilerToolbar
            signInRequired={anonymous}
            languages={LANGUAGES}
            languageId={languageId}
            onLanguageChange={switchLanguage}
            theme={editorTheme}
            onToggleTheme={toggleTheme}
            fontSize={fontSize}
            fontMin={FONT_MIN}
            fontMax={FONT_MAX}
            onFontSize={adjustFontSize}
            fullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((v) => !v)}
            onCopyCode={copyCode}
            copiedCode={copiedCode}
            onDownload={downloadCode}
            onReset={resetToStarter}
            onRun={runNow}
            busy={running}
          />
        }
        ready={ready}
        code={code}
        onCodeChange={setCode}
        prismLanguage={activeLang.prism}
        editorAriaLabel={`${activeLang.label} code editor`}
        editorTheme={editorTheme}
        onRun={runNow}
        fontSize={fontSize}
        onCursorChange={setCursor}
        stdin={stdin}
        onStdinChange={setStdin}
        onClearStdin={() => setStdin("")}
        output={<OutputBody state={runState} anonymous={anonymous} next={next} />}
        onCopyOutput={copyOutput}
        copiedOutput={copiedOutput}
        canCopyOutput={
          runState.phase === "done" && (!!runState.run.stdout || !!runState.run.stderr)
        }
        onClearOutput={() => setRunState({ phase: "idle" })}
        canClearOutput={runState.phase !== "idle"}
        statusLeft={statusLeft}
      />
    </div>
  );
}

function StatusPill({
  tone,
  icon: Icon,
  children,
}: {
  tone: "success" | "error" | "warn";
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-400"
      : tone === "error"
        ? "bg-red-500/15 text-red-400"
        : "bg-amber-500/15 text-amber-400";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  );
}

function OutputBody({ state, anonymous, next }: { state: RunState; anonymous: boolean; next: string }) {
  return state.phase === "signin" || (anonymous && state.phase === "idle") ? (
    <SignInToRun next={next} />
  ) : state.phase === "idle" ? (
    <p className="text-slate-400">Run your code to see the output here.</p>
  ) : state.phase === "running" ? (
    <p className="flex items-center gap-2 text-slate-300">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Running…
    </p>
  ) : state.phase === "error" ? (
    <div role="alert" className="space-y-2">
      <StatusPill tone="error" icon={XCircle}>
        Couldn&apos;t run your code
      </StatusPill>
      <p className="whitespace-pre-wrap text-red-300">{state.message}</p>
    </div>
  ) : (
    <RunOutput run={state.run} hadEmptyStdin={state.hadEmptyStdin} />
  );
}

function RunOutput({ run, hadEmptyStdin }: { run: NormalizedRun; hadEmptyStdin: boolean }) {
  if (run.timedOut) {
    return (
      <div role="alert" className="space-y-2">
        <StatusPill tone="warn" icon={Clock}>
          Timed out
        </StatusPill>
        <p className="text-amber-200">
          Your program ran longer than the time limit — check for an infinite loop or blocking input.
        </p>
      </div>
    );
  }
  if (run.status === "compile_error") {
    return <RuntimeErrorCard kind="compile" detail={run.compileOutput || "The compiler reported an error."} />;
  }

  const isRuntimeError = run.status === "runtime_error";
  const emptyStdinHint =
    isRuntimeError && hadEmptyStdin ? (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
        If your program reads input (<code>input()</code>, <code>Scanner</code>, <code>cin</code>, …), add it in the{" "}
        <strong>Input</strong> panel, then run again — it was empty for this run.
      </p>
    ) : undefined;

  return (
    <div className="space-y-3">
      {isRuntimeError ? (
        <RuntimeErrorCard kind="runtime" detail={run.stderr || "No error details were returned."} hint={emptyStdinHint} />
      ) : (
        <StatusPill tone="success" icon={CheckCircle2}>
          Success
        </StatusPill>
      )}
      {run.stdout ? <pre className="whitespace-pre-wrap">{run.stdout}</pre> : null}
      {!isRuntimeError && !run.stdout ? <p className="text-slate-400">Program finished with no output.</p> : null}
      <p className="border-t border-white/10 pt-2 text-xs text-slate-400">
        exit code {run.exitCode ?? "—"} · {run.timeMs} ms
      </p>
    </div>
  );
}
