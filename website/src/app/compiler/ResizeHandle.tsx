"use client";

import { GripHorizontal, GripVertical } from "lucide-react";
import type { ResizableSplit } from "@/lib/compiler/useResizableSplit";
import { cn } from "@/lib/cn";

/**
 * Draggable divider between two resizable panes of the standalone compiler.
 * Presentational only — the drag mechanics (pointer capture, clamping,
 * keyboard, persistence) live in `useResizableSplit`; this just spreads that
 * hook's `handleProps` onto a full-track hit area and paints the VS Code /
 * LeetCode-style affordance: a hairline that turns primary on hover/focus plus
 * a small grip pill.
 *
 * A near-identical handle exists under `coding-problems/_components/` — kept
 * separate on purpose so the two workspaces (standalone vs. problem IDE) can
 * evolve independently. Desktop only (`hidden lg:flex`); the mobile layout
 * stacks the panes with nothing to drag.
 */
export function ResizeHandle({
  handleProps,
  orientation,
  label,
  className,
}: {
  handleProps: ResizableSplit["handleProps"];
  /** "vertical" = a column divider dragged left/right. "horizontal" = a row divider dragged up/down. */
  orientation: "vertical" | "horizontal";
  label: string;
  className?: string;
}) {
  const vertical = orientation === "vertical";
  const Grip = vertical ? GripVertical : GripHorizontal;

  return (
    <div
      {...handleProps}
      aria-label={label}
      title={label}
      className={cn(
        "group relative z-10 hidden shrink-0 touch-none select-none items-center justify-center outline-none lg:flex",
        vertical ? "cursor-col-resize" : "cursor-row-resize",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bg-white/10 transition-colors duration-150 group-hover:bg-primary/70 group-focus-visible:bg-primary",
          vertical ? "inset-y-0 left-1/2 w-px -translate-x-1/2" : "inset-x-0 top-1/2 h-px -translate-y-1/2",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "relative flex items-center justify-center rounded-full border border-white/15 bg-[#1e293b] text-slate-400 shadow-sm transition-colors duration-150",
          "group-hover:border-primary-400/60 group-hover:bg-primary-500/20 group-hover:text-primary-200 group-focus-visible:border-primary-300",
          vertical ? "h-8 w-[18px]" : "h-[18px] w-8",
        )}
      >
        <Grip className="h-3.5 w-3.5" aria-hidden />
      </span>
    </div>
  );
}

export default ResizeHandle;
