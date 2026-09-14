"use client";

import type { ReactNode } from "react";
import { useResizableSplit } from "@/lib/compiler/useResizableSplit";
import { CODING_LAYOUT_DEFAULTS, loadCodingLayout, saveCodingLayout } from "@/lib/compiler/codingLayout";
import { ResizeHandle } from "./ResizeHandle";

/**
 * Input | divider | Output. Side-by-side and horizontally resizable on desktop
 * (persisted); stacked on mobile with the divider hidden. On mobile each panel
 * carries its own height so nothing collapses inside an auto-height column.
 */
export function IOPanel({ input, output }: { input: ReactNode; output: ReactNode }) {
  const split = useResizableSplit({
    axis: "x",
    initial: CODING_LAYOUT_DEFAULTS.io,
    min: 22,
    max: 78,
    minFirstPx: 220,
    minSecondPx: 220,
    handlePx: 12,
    persist: { load: () => loadCodingLayout("io"), save: (p) => saveCodingLayout("io", p) },
  });

  return (
    <div
      ref={split.containerRef}
      className="flex flex-col gap-3 lg:grid lg:h-full lg:min-h-0 lg:gap-0 lg:grid-cols-[var(--io)_12px_minmax(0,1fr)]"
      style={{ "--io": `${split.pct}%` } as React.CSSProperties}
    >
      {/* Mobile: both panels carry a definite height so their inner flex-1
          bodies don't collapse inside this auto-height column. Desktop: the
          grid tracks own the sizing. */}
      <div className="h-44 min-w-0 shrink-0 lg:h-auto lg:min-h-0">{input}</div>
      <ResizeHandle
        handleProps={split.handleProps}
        orientation="vertical"
        tone="dark"
        label="Resize input and output panels"
      />
      <div className="h-72 min-w-0 lg:h-auto lg:min-h-0">{output}</div>
    </div>
  );
}

export default IOPanel;
