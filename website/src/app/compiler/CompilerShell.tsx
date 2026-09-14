"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Terminal, TerminalSquare } from "lucide-react";
import { useResizableSplit } from "@/lib/compiler/useResizableSplit";
import {
  COMPILER_LAYOUT_DEFAULTS,
  loadCompilerLayout,
  saveCompilerLayout,
} from "@/lib/compiler/standaloneLayout";
import { cn } from "@/lib/cn";
import type { CursorPosition } from "./CodeEditor";
import { ResizeHandle } from "./ResizeHandle";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-[#0f172a] text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

export interface CompilerShellProps {
  /** Fullscreen: fill the viewport, drop the card frame. */
  bare?: boolean;
  /** Height utility for the outer container (desktop). */
  className?: string;

  /** The toolbar row (language picker + actions), rendered flush at the top. */
  toolbar: ReactNode;

  // ---- editor ----
  ready: boolean;
  code: string;
  onCodeChange: (next: string) => void;
  /** Prism grammar name, e.g. "java" / "python" / "cpp". */
  prismLanguage: string;
  editorAriaLabel: string;
  editorTheme: "dark" | "light";
  onRun: () => void;
  fontSize?: number;
  onCursorChange?: (pos: CursorPosition) => void;

  // ---- input ----
  stdin: string;
  onStdinChange: (next: string) => void;
  onClearStdin: () => void;

  // ---- output ----
  output: ReactNode;
  onCopyOutput: () => void;
  copiedOutput: boolean;
  canCopyOutput: boolean;
  onClearOutput: () => void;
  canClearOutput: boolean;

  /** Left-hand status text (cursor position, char count, language, timing). */
  statusLeft: string;
}

/**
 * The one shared standalone-compiler layout — a centered dark IDE card:
 *
 *   ┌ toolbar ───────────────────────────────┐
 *   │ large code editor                      │
 *   ├──── draggable divider (editor ↕ I/O) ──┤
 *   │ Input (stdin)  ┆  Output               │   ← draggable divider ┆ between them
 *   └ status bar ────────────────────────────┘
 *
 * Used by `/compiler`, `/practice/compiler` and the tutorial "Run Code" hand-off
 * (all render `CompilerWorkspace`, which owns run/draft/deep-link logic and
 * passes the pieces in here). Kept independent from the `/coding-problems/[slug]`
 * IDE on purpose — same visual language, separate components.
 */
export function CompilerShell({
  bare = false,
  className,
  toolbar,
  ready,
  code,
  onCodeChange,
  prismLanguage,
  editorAriaLabel,
  editorTheme,
  onRun,
  fontSize,
  onCursorChange,
  stdin,
  onStdinChange,
  onClearStdin,
  output,
  onCopyOutput,
  copiedOutput,
  canCopyOutput,
  onClearOutput,
  canClearOutput,
  statusLeft,
}: CompilerShellProps) {
  const editorSplit = useResizableSplit({
    axis: "y",
    initial: COMPILER_LAYOUT_DEFAULTS.editor,
    min: 25,
    max: 82,
    minFirstPx: 240,
    minSecondPx: 170,
    handlePx: 10,
    persist: { load: () => loadCompilerLayout("editor"), save: (p) => saveCompilerLayout("editor", p) },
  });
  const ioSplit = useResizableSplit({
    axis: "x",
    initial: COMPILER_LAYOUT_DEFAULTS.io,
    min: 22,
    max: 78,
    minFirstPx: 200,
    minSecondPx: 220,
    handlePx: 10,
    persist: { load: () => loadCompilerLayout("io"), save: (p) => saveCompilerLayout("io", p) },
  });

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden bg-[#0b1120]",
        bare ? "h-full rounded-none border-0" : "rounded-2xl border border-line shadow-card",
        className,
      )}
    >
      <div className="shrink-0">{toolbar}</div>

      {/* Editor (top) / Input+Output (bottom) — stacked on mobile, a resizable
          grid on desktop. `minmax(0, 1fr)` for the bottom track (not a second
          %) so the two rows + the 10px divider can't sum past 100% mid-drag. */}
      <div
        ref={editorSplit.containerRef}
        className="flex flex-col gap-3 p-3 lg:grid lg:min-h-0 lg:flex-1 lg:gap-0 lg:grid-rows-[var(--eh)_10px_minmax(0,1fr)]"
        style={{ "--eh": `${editorSplit.pct}%` } as React.CSSProperties}
      >
        <div className="h-[46vh] min-h-[240px] lg:h-auto lg:min-h-0">
          {ready ? (
            <CodeEditor
              value={code}
              onChange={onCodeChange}
              language={prismLanguage}
              onRun={onRun}
              ariaLabel={editorAriaLabel}
              theme={editorTheme}
              fontSize={fontSize}
              onCursorChange={onCursorChange}
              className="h-full"
            />
          ) : (
            <div
              className={cn(
                "h-full rounded-xl border",
                editorTheme === "light" ? "border-line bg-white" : "border-white/10 bg-[#0f172a]",
              )}
            />
          )}
        </div>

        <ResizeHandle
          handleProps={editorSplit.handleProps}
          orientation="horizontal"
          label="Resize code editor and input/output"
        />

        <div className="min-w-0 lg:min-h-0">
          <div
            ref={ioSplit.containerRef}
            className="flex flex-col gap-3 lg:grid lg:h-full lg:min-h-0 lg:gap-0 lg:grid-cols-[var(--io)_10px_minmax(0,1fr)]"
            style={{ "--io": `${ioSplit.pct}%` } as React.CSSProperties}
          >
            <div className="h-40 min-w-0 shrink-0 lg:h-auto lg:min-h-0">
              <InputPane value={stdin} onChange={onStdinChange} onClear={onClearStdin} />
            </div>

            <ResizeHandle
              handleProps={ioSplit.handleProps}
              orientation="vertical"
              label="Resize input and output panels"
            />

            <div className="h-64 min-w-0 lg:h-auto lg:min-h-0">
              <OutputPane
                onCopy={onCopyOutput}
                copied={copiedOutput}
                canCopy={canCopyOutput}
                onClear={onClearOutput}
                canClear={canClearOutput}
              >
                {output}
              </OutputPane>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#0f172a] px-3 py-1.5 text-[11px] text-slate-400">
        <span className="truncate">{statusLeft}</span>
        <span className="hidden shrink-0 sm:inline">Ctrl+Enter to run</span>
      </div>
    </div>
  );
}

function InputPane({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
}) {
  return (
    <section
      aria-label="Custom input"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <TerminalSquare className="h-4 w-4 text-slate-400" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Input (stdin)</h3>
        <button
          type="button"
          onClick={onClear}
          disabled={value.length === 0}
          title="Clear input"
          aria-label="Clear input"
          className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Clear
        </button>
      </header>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder="Text passed to your program's standard input (Scanner, input(), cin, …)"
        aria-label="Custom input (stdin)"
        className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 [scrollbar-width:thin]"
      />
    </section>
  );
}

function OutputPane({
  children,
  onCopy,
  copied,
  canCopy,
  onClear,
  canClear,
}: {
  children: ReactNode;
  onCopy: () => void;
  copied: boolean;
  canCopy: boolean;
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <section
      aria-label="Output"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <Terminal className="h-4 w-4 text-slate-400" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Output</h3>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onCopy}
            disabled={!canCopy}
            title="Copy output"
            aria-label="Copy output"
            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={!canClear}
            title="Clear output"
            aria-label="Clear output"
            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Clear
          </button>
        </div>
      </header>
      <div
        aria-live="polite"
        className="min-h-0 flex-1 overflow-auto p-3.5 font-mono text-[13px] leading-relaxed text-slate-100 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </section>
  );
}

export default CompilerShell;
