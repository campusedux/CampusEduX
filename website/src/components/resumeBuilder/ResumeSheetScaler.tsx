"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SHEET_WIDTH_PX } from "./ResumeDocumentView";

/**
 * Scales a fixed-794px <ResumeDocumentView> down to whatever width it's given,
 * keeping the A4 proportions and letting the (scaled) height push page flow —
 * so the live preview and the /r/[token] share page show a real A4 sheet that
 * fits the column instead of an unreadable squeeze or a horizontal scrollbar.
 */
export function ResumeSheetScaler({
  children,
  zoom = 1,
  maxScale = 1,
  className,
}: {
  children: ReactNode;
  /** extra multiplier on top of fit-to-width (used by the preview modal's zoom). */
  zoom?: number;
  /** never upscale past this (1 = never bigger than real A4). */
  maxScale?: number;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const next = Math.min(maxScale, (outer.clientWidth / SHEET_WIDTH_PX) * zoom);
      setScale(next > 0 ? next : 0);
      setInnerHeight(inner.offsetHeight);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [zoom, maxScale]);

  return (
    <div ref={outerRef} className={className} style={{ width: "100%" }}>
      <div style={{ height: innerHeight * scale, overflow: "hidden" }}>
        <div
          ref={innerRef}
          style={{
            width: SHEET_WIDTH_PX,
            transform: `scale(${scale || 0.001})`,
            transformOrigin: "top left",
            boxShadow: "0 1px 3px rgba(17,24,39,0.08), 0 8px 24px rgba(17,24,39,0.06)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default ResumeSheetScaler;
