"use client";

import type { ReactNode } from "react";
import { useResizableSplit } from "@/lib/compiler/useResizableSplit";
import { CODING_LAYOUT_DEFAULTS, loadCodingLayout, saveCodingLayout } from "@/lib/compiler/codingLayout";
import { ResizeHandle } from "./ResizeHandle";

/**
 * Top-level workspace shell for `/coding-problems/[slug]`.
 *
 * Desktop (`lg+`): a fixed-height split that fills the viewport below the header
 * — Problem panel (independently scrolls) | draggable divider | Compiler panel.
 * The page itself doesn't grow, so the footer stays below the fold.
 *
 * Mobile / small tablet: the two panels simply stack (Problem → Compiler) and
 * the page scrolls normally; the divider is hidden.
 *
 * `left` / `right` are rendered by the (server) component that calls this, so
 * the problem statement stays in the server HTML — this island only owns
 * geometry, never content.
 */
export function CodingProblemLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  const split = useResizableSplit({
    axis: "x",
    initial: CODING_LAYOUT_DEFAULTS.left,
    min: 22,
    max: 68,
    minFirstPx: 320,
    minSecondPx: 500,
    handlePx: 12,
    persist: { load: () => loadCodingLayout("left"), save: (p) => saveCodingLayout("left", p) },
  });

  return (
    <div
      ref={split.containerRef}
      className="flex flex-col gap-4 px-3 py-4 lg:grid lg:h-[calc(100dvh-4rem)] lg:gap-0 lg:overflow-hidden lg:p-0 lg:grid-cols-[var(--lw)_12px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
      style={{ "--lw": `${split.pct}%` } as React.CSSProperties}
    >
      <div className="min-w-0 overflow-y-auto rounded-2xl border border-line bg-card lg:rounded-none lg:border-0 lg:border-r lg:border-line">
        {left}
      </div>

      <ResizeHandle
        handleProps={split.handleProps}
        orientation="vertical"
        tone="light"
        label="Resize problem and compiler panels"
      />

      <div className="min-w-0 lg:overflow-hidden">{right}</div>
    </div>
  );
}

export default CodingProblemLayout;
