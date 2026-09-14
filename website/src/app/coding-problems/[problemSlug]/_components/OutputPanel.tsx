"use client";

import type { ReactNode } from "react";
import { Terminal } from "lucide-react";

/**
 * Terminal-style output panel. `children` is the caller's rendered run / judge
 * result (idle, running, error, stdout, test table …); this only frames it and
 * offers a Clear that resets the caller's run state.
 */
export function OutputPanel({
  children,
  onClear,
  canClear,
}: {
  children: ReactNode;
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
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          title="Clear output"
          aria-label="Clear output"
          className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10 hover:text-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Clear
        </button>
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

export default OutputPanel;
