"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared drag-to-resize behaviour for a two-pane split (compiler editor/output,
 * problem/compiler columns, …). Pointer-capture based — no window listeners for
 * the drag itself, no dependency. One pane's size is tracked as a percentage of
 * the container; the caller renders the container + two panes + a handle and
 * spreads `handleProps` onto the handle element.
 *
 * `min`/`max` are the percentage floor/ceiling (always enforced). When a caller
 * also cares about an absolute pixel-size floor for each pane — so a pane can
 * never be dragged (or squeezed by a container resize) below a usable size —
 * pass `minFirstPx`/`minSecondPx` plus `handlePx` (the divider's fixed size
 * along the resize axis). Those are converted to percentages against the
 * container's *live* measured size on every drag step and on every container
 * resize, so the clamp always reflects the actual rendered box rather than a
 * hardcoded viewport guess.
 */

export interface UseResizableSplitOptions {
  /** "x" = a vertical divider dragged left/right (columns). "y" = a horizontal divider dragged up/down (rows). */
  axis: "x" | "y";
  /** Starting size of the first pane, as a percentage of the container. */
  initial: number;
  /** Minimum percentage the first pane may shrink to. */
  min: number;
  /** Maximum percentage the first pane may grow to. */
  max: number;
  /** Absolute minimum size (px) of the first pane, measured against the container's live size. */
  minFirstPx?: number;
  /** Absolute minimum size (px) of the second pane, measured against the container's live size. */
  minSecondPx?: number;
  /** Fixed size (px) of the divider along the resize axis — subtracted before converting the px minimums above to percentages. Defaults to 0. */
  handlePx?: number;
}

export interface ResizableSplit {
  /** First pane's current size, as a percentage (0-100) of the container. */
  pct: number;
  /** Attach to the element wrapping both panes and the handle. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Spread onto the draggable handle element. */
  handleProps: {
    role: "separator";
    "aria-orientation": "horizontal" | "vertical";
    "aria-valuenow": number;
    "aria-valuemin": number;
    "aria-valuemax": number;
    tabIndex: number;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onDoubleClick: () => void;
  };
}

export function useResizableSplit({
  axis,
  initial,
  min,
  max,
  minFirstPx,
  minSecondPx,
  handlePx = 0,
}: UseResizableSplitOptions): ResizableSplit {
  const [pct, setPct] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const clamp = useCallback(
    (n: number) => {
      let lo = min;
      let hi = max;
      const rect = containerRef.current?.getBoundingClientRect();
      const size = rect ? (axis === "x" ? rect.width : rect.height) : 0;
      if (size > 0 && (minFirstPx != null || minSecondPx != null)) {
        const usable = Math.max(size - handlePx, 1);
        if (minFirstPx != null) lo = Math.max(lo, (minFirstPx / usable) * 100);
        if (minSecondPx != null) hi = Math.min(hi, 100 - (minSecondPx / usable) * 100);
      }
      // Container too small to satisfy both pixel minimums at once — split the
      // difference rather than producing an inverted (lo > hi) clamp range.
      if (lo > hi) return (lo + hi) / 2;
      return Math.min(hi, Math.max(lo, n));
    },
    [axis, min, max, minFirstPx, minSecondPx, handlePx],
  );

  // Re-clamp whenever the container's own size changes (window resize, a
  // fullscreen toggle swapping the height class, orientation change, …) so a
  // previously valid split can't end up violating a pixel minimum after the
  // container shrinks — without this, `pct` would stay put and only the CSS
  // grid's `minmax(0, 1fr)` track would visibly absorb the difference.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setPct((p) => clamp(p));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [clamp]);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const next =
        axis === "x" ? ((clientX - rect.left) / rect.width) * 100 : ((clientY - rect.top) / rect.height) * 100;
      setPct(clamp(next));
    },
    [axis, clamp],
  );

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer],
  );
  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const decKey = axis === "x" ? "ArrowLeft" : "ArrowUp";
      const incKey = axis === "x" ? "ArrowRight" : "ArrowDown";
      if (e.key === decKey) {
        e.preventDefault();
        setPct((p) => clamp(p - 2));
      } else if (e.key === incKey) {
        e.preventDefault();
        setPct((p) => clamp(p + 2));
      } else if (e.key === "Home") {
        e.preventDefault();
        setPct(clamp(initial));
      }
    },
    [axis, clamp, initial],
  );

  return {
    pct,
    containerRef,
    handleProps: {
      role: "separator",
      "aria-orientation": axis === "x" ? "vertical" : "horizontal",
      "aria-valuenow": Math.round(pct),
      "aria-valuemin": min,
      "aria-valuemax": max,
      tabIndex: 0,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onKeyDown,
      onDoubleClick: () => setPct(clamp(initial)),
    },
  };
}
