"use client";

import { TerminalSquare } from "lucide-react";

/**
 * Terminal-style stdin panel. The caller owns `value` and folds it into the
 * same `/api/compiler/run` request it always has — this is presentation plus a
 * one-shot "load an example" helper.
 */
export function InputPanel({
  value,
  onChange,
  onClear,
  exampleInputs,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
  /** Example stdin strings from the problem — powers the "Use Example" menu. */
  exampleInputs: string[];
}) {
  return (
    <section
      aria-label="Custom input"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <TerminalSquare className="h-4 w-4 text-slate-400" aria-hidden />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Input (stdin)</h3>
        <div className="ml-auto flex items-center gap-1.5">
          {exampleInputs.length > 0 ? (
            <select
              value=""
              onChange={(e) => {
                const i = Number(e.target.value);
                if (Number.isInteger(i) && exampleInputs[i] !== undefined) onChange(exampleInputs[i]);
                e.currentTarget.selectedIndex = 0;
              }}
              aria-label="Load an example into the input"
              className="h-7 rounded-md border border-white/15 bg-white/5 px-2 text-xs font-semibold text-slate-200 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="" className="bg-white text-ink">
                Use Example
              </option>
              {exampleInputs.map((_, i) => (
                <option key={i} value={i} className="bg-white text-ink">
                  Example {i + 1}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={onClear}
            disabled={value.length === 0}
            title="Clear input"
            aria-label="Clear input"
            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Clear
          </button>
        </div>
      </header>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder="Enter custom input here..."
        aria-label="Custom input (stdin)"
        className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 [scrollbar-width:thin]"
      />
    </section>
  );
}

export default InputPanel;
