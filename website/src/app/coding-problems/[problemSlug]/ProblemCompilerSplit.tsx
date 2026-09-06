"use client";

import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { useResizableSplit } from "@/lib/compiler/useResizableSplit";

/**
 * Resizable Problem (left) / Compiler (right) columns for `/coding-problems`.
 * A thin client island purely for the drag mechanic — `left`/`right` are
 * rendered by the server component that calls this (`CodingProblemBody`), so
 * the problem statement stays part of the server-rendered HTML for SEO; this
 * component only ever touches layout, not content.
 */
export function ProblemCompilerSplit({ left, right }: { left: ReactNode; right: ReactNode }) {
  const split = useResizableSplit({ axis: "x", initial: 40, min: 25, max: 55 });

  return (
    <div
      ref={split.containerRef}
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[var(--split)_10px_minmax(0,1fr)] lg:gap-0"
      style={{ "--split": `${split.pct}%` } as React.CSSProperties}
    >
      <div className="min-w-0 lg:pr-4">{left}</div>

      <div
        {...split.handleProps}
        aria-label="Resize problem and compiler panels"
        className="group hidden cursor-col-resize select-none touch-none items-center justify-center outline-none lg:flex"
      >
        <GripVertical
          className="h-6 w-4 text-ink-faint transition group-hover:text-primary group-focus-visible:text-primary"
          aria-hidden
        />
      </div>

      <div className="min-w-0 lg:pl-4">{right}</div>
    </div>
  );
}

export default ProblemCompilerSplit;
