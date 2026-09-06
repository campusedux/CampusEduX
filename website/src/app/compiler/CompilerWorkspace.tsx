"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Play,
  RotateCcw,
  Loader2,
  Copy,
  Check,
  Download,
  Settings,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, Select } from "@/components/ui";
import {
  LANGUAGES,
  DEFAULT_LANGUAGE_ID,
  resolveLanguage,
  starterFor,
} from "@/lib/compiler/languages";
import { DRAFT_STORAGE_PREFIX, HANDOFF_STORAGE_KEY } from "@/lib/compiler/handoff";
import type { NormalizedRun } from "@/lib/compiler/providers/types";
import type { CursorPosition } from "./CodeEditor";
import { CompilerPane } from "./CompilerPane";
import { RuntimeErrorCard } from "./RuntimeErrorCard";

const LANG_STORAGE_KEY = "campusedux:compiler:lang";
const FONT_STORAGE_KEY = "campusedux:compiler:fontsize";

const FONT_MIN = 11;
const FONT_MAX = 22;
const FONT_DEFAULT = 14;

type RunState =
  | { phase: "idle" }
  | { phase: "running" }
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

export default function CompilerWorkspace() {
  const searchParams = useSearchParams();

  const [languageId, setLanguageId] = useState<string>(DEFAULT_LANGUAGE_ID);
  const [code, setCode] = useState<string>("");
  const [stdin, setStdin] = useState<string>("");
  const [outputTab, setOutputTab] = useState<"output" | "input">("output");
  const [runState, setRunState] = useState<RunState>({ phase: "idle" });
  const [ready, setReady] = useState(false);

  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [fullscreen, setFullscreen] = useState(false);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const activeLang = useMemo(
    () => resolveLanguage(languageId) ?? LANGUAGES[0],
    [languageId],
  );
  const runningRef = useRef(false);

  const doRun = useCallback(
    async (source: string, lang: string, input: string) => {
      if (runningRef.current) return;
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
          setRunState({
            phase: "error",
            message:
              data.error ||
              (res.status === 503
                ? "The compiler isn't configured yet. Please try again later."
                : `The compiler request failed (${res.status}).`),
          });
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

  // ---- close the font-size settings popover on outside click / Escape -----
  useEffect(() => {
    if (!settingsOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSettingsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

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

  return (
    <div className={fullscreen ? "fixed inset-0 z-[60] overflow-y-auto bg-white p-4 sm:p-6" : "container-page py-6"}>
      <div className="flex flex-col gap-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="compiler-language" className="sr-only">
            Language
          </label>
          <Select
            id="compiler-language"
            value={languageId}
            onChange={(e) => switchLanguage(e.target.value)}
            className="w-36"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            onClick={() => doRun(code, languageId, stdin)}
            loading={running}
            leftIcon={running ? undefined : Play}
            aria-keyshortcuts="Control+Enter"
          >
            {running ? "Running…" : "Run Code"}
          </Button>
          <Button type="button" variant="ghost" leftIcon={RotateCcw} onClick={resetToStarter} disabled={running}>
            Reset
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <IconButton title="Copy code" onClick={copyCode}>
              {copiedCode ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            </IconButton>
            <IconButton title="Download source file" onClick={downloadCode}>
              <Download className="h-4 w-4" aria-hidden />
            </IconButton>
            <div ref={settingsRef} className="relative">
              <IconButton
                title="Editor settings"
                onClick={() => setSettingsOpen((v) => !v)}
                aria-expanded={settingsOpen}
              >
                <Settings className="h-4 w-4" aria-hidden />
              </IconButton>
              {settingsOpen ? (
                <div
                  aria-label="Editor settings"
                  className="absolute right-0 top-full z-10 mt-2 w-48 rounded-xl border border-line bg-white p-3 shadow-card-lg animate-scale-in"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Font size</p>
                  <div className="flex items-center justify-between rounded-lg border border-line">
                    <IconButton
                      title="Decrease font size"
                      onClick={() => adjustFontSize(-1)}
                      disabled={fontSize <= FONT_MIN}
                      className="border-0"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </IconButton>
                    <span className="select-none text-center text-sm font-medium text-ink" aria-hidden>
                      {fontSize}px
                    </span>
                    <IconButton
                      title="Increase font size"
                      onClick={() => adjustFontSize(1)}
                      disabled={fontSize >= FONT_MAX}
                      className="border-0"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </IconButton>
                  </div>
                </div>
              ) : null}
            </div>
            <IconButton title={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={() => setFullscreen((v) => !v)}>
              {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
            </IconButton>
          </div>
        </div>

        <CompilerPane
          ready={ready}
          code={code}
          onChange={setCode}
          language={activeLang.prism}
          ariaLabel={`${activeLang.label} code editor`}
          onRun={() => doRun(code, languageId, stdin)}
          fontSize={fontSize}
          onCursorChange={setCursor}
          heightClassName={fullscreen ? "h-[calc(100vh-260px)] min-h-[420px]" : "h-[68vh] min-h-[520px]"}
          tabs={{ active: outputTab, onChange: setOutputTab, hasInput: stdin.trim().length > 0 }}
          input={
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Text passed to your program's standard input (Scanner, input(), cin, …)"
              spellCheck={false}
              aria-label="Custom input (stdin)"
              className="h-full w-full resize-none bg-transparent font-mono text-[13px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-500"
            />
          }
          outputActions={
            <IconButton
              title="Copy output"
              onClick={copyOutput}
              disabled={runState.phase !== "done" || (!runState.run.stdout && !runState.run.stderr)}
            >
              {copiedOutput ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            </IconButton>
          }
          output={<OutputBody state={runState} />}
        />

        {/* Status bar */}
        <div className="flex items-center justify-between px-0.5 text-xs text-ink-faint">
          <span>
            Ln {cursor.line}, Col {cursor.column} · {code.length.toLocaleString()} chars · {activeLang.label}
            {runState.phase === "done" ? ` · ${runState.run.timeMs} ms` : ""}
          </span>
          <span className="hidden sm:inline">Ctrl+Enter to run</span>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
  disabled,
  className,
  "aria-expanded": ariaExpanded,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition hover:bg-surface hover:text-ink active:scale-95 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transform-none ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function StatusPill({ tone, icon: Icon, children }: { tone: "success" | "error" | "warn"; icon: LucideIcon; children: React.ReactNode }) {
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

function OutputBody({ state }: { state: RunState }) {
  return state.phase === "idle" ? (
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
        <strong>Input</strong> tab above, then run again — it was empty for this run.
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
