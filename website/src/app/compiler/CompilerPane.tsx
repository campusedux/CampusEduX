"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { GripHorizontal } from "lucide-react";
import { useResizableSplit } from "@/lib/compiler/useResizableSplit";
import type { CursorPosition } from "./CodeEditor";
import { CustomInputPanel } from "./CustomInputPanel";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-line bg-[#0f172a] text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

type CompilerPaneCommonProps = {
  ready: boolean;
  code: string;
  onChange: (next: string) => void;
  language: string;
  ariaLabel: string;
  onRun: () => void;
  fontSize?: number;
  onCursorChange?: (pos: CursorPosition) => void;
  heightClassName?: string;
  output: ReactNode;
};

/** Custom Input rendered as a collapsible strip below the output (original layout). */
type CompilerPaneLegacyProps = CompilerPaneCommonProps & {
  tabs?: undefined;
  outputHeader: ReactNode;
  stdinOpen: boolean;
  onStdinToggle: () => void;
  stdin: string;
  onStdinChange: (next: string) => void;
  stdinLabel?: string;
};

/** Output/Input rendered as a tab pair in the same pane — no separate stdin strip. */
type CompilerPaneTabsProps = CompilerPaneCommonProps & {
  tabs: {
    active: "output" | "input";
    onChange: (tab: "output" | "input") => void;
    /** Shows a small dot on the Input tab when there's saved stdin, even while viewing Output. */
    hasInput?: boolean;
  };
  input: ReactNode;
  /** Right-aligned controls next to the tab bar (e.g. a copy-output button, exec time). */
  outputActions?: ReactNode;
};

export type CompilerPaneProps = CompilerPaneLegacyProps | CompilerPaneTabsProps;

/**
 * The one reusable compiler workspace layout, shared by the standalone
 * `/compiler` playground and every `/coding-problems/[slug]` page (a single
 * dynamic template already, so this covers every language/topic/problem).
 * Order is fixed here — editor, then output, then Custom Input (as a
 * collapsed strip, or as an "Input" tab beside "Output") — so no caller can
 * regress it back to Custom Input sitting between the editor and the output.
 * Callers own their own language/run/judge logic and toolbar; this only owns
 * the split + panel arrangement. Pass `tabs` (mirrors the `AsButton | AsLink`
 * pattern in `Button.tsx`) to switch to the tab layout — omit it to keep the
 * original collapsible-strip behaviour untouched.
 */
export function CompilerPane(props: CompilerPaneProps) {
  const {
    ready,
    code,
    onChange,
    language,
    ariaLabel,
    onRun,
    fontSize,
    onCursorChange,
    heightClassName = "h-[64vh] min-h-[480px]",
    output,
  } = props;
  const split = useResizableSplit({
    axis: "y",
    initial: 50,
    min: 20,
    max: 80,
    minFirstPx: 200, // Editor
    minSecondPx: 150, // Output
    handlePx: 10, // divider row height, reserved below
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Editor (top) / Output (bottom) — resizable, both visible by default.
          The output row is `minmax(0, 1fr)`, not `${100 - pct}%` — two percentage
          rows plus the divider's fixed 10px would sum to over 100% of the
          container and overflow it on every drag; 1fr instead just takes
          whatever's left after the editor row and the divider are placed. */}
      <div
        ref={split.containerRef}
        className={`grid ${heightClassName}`}
        style={{ gridTemplateRows: `${split.pct}% 10px minmax(0, 1fr)` }}
      >
        <div className="min-h-0">
          {ready ? (
            <CodeEditor
              value={code}
              onChange={onChange}
              language={language}
              onRun={onRun}
              ariaLabel={ariaLabel}
              className="h-full"
              fontSize={fontSize}
              onCursorChange={onCursorChange}
            />
          ) : (
            <div className="h-full rounded-xl border border-line bg-[#0f172a]" />
          )}
        </div>

        <div
          {...split.handleProps}
          aria-label="Resize editor and output"
          className="group flex cursor-row-resize touch-none select-none items-center justify-center outline-none"
        >
          <GripHorizontal
            className="h-4 w-6 text-ink-faint transition group-hover:text-primary group-focus-visible:text-primary"
            aria-hidden
          />
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          {props.tabs ? (
            <div className="flex items-center justify-between gap-2">
              <div
                role="tablist"
                aria-label="Output or input"
                className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs font-semibold"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={props.tabs.active === "output"}
                  onClick={() => props.tabs!.onChange("output")}
                  className={`rounded-md px-3 py-1.5 transition ${
                    props.tabs.active === "output" ? "bg-white text-ink shadow-sm" : "text-ink-faint hover:text-ink"
                  }`}
                >
                  Output
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={props.tabs.active === "input"}
                  onClick={() => props.tabs!.onChange("input")}
                  className={`relative rounded-md px-3 py-1.5 transition ${
                    props.tabs.active === "input" ? "bg-white text-ink shadow-sm" : "text-ink-faint hover:text-ink"
                  }`}
                >
                  Input
                  {props.tabs.hasInput ? (
                    <span
                      className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>
              {props.outputActions}
            </div>
          ) : (
            props.outputHeader
          )}
          <div
            aria-live="polite"
            className="min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-[#0f172a] p-4 font-mono text-[13px] leading-relaxed text-slate-100"
          >
            {props.tabs ? (props.tabs.active === "output" ? output : props.input) : output}
          </div>
        </div>
      </div>

      {/* Custom Input always comes last — below the output, never between it and the editor.
          Skipped entirely in tabs mode: Input is its own tab there, not a strip below. */}
      {props.tabs ? null : (
        <CustomInputPanel
          open={props.stdinOpen}
          onToggle={props.onStdinToggle}
          value={props.stdin}
          onChange={props.onStdinChange}
          label={props.stdinLabel}
        />
      )}
    </div>
  );
}

export default CompilerPane;
