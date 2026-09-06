"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ResumeDocumentView, SHEET_WIDTH_PX } from "./ResumeDocumentView";
import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import type { ResumeRenderModel } from "@/lib/resumeBuilder/renderModel";

/**
 * A real, miniature render of a résumé — the actual <ResumeDocumentView>
 * scaled to the card width and clipped to A4 proportions.
 *
 * `model` is always supplied by the caller (a server component computes the
 * template's demo model), so the ~10 kB `demoResumes` data blob never enters
 * this client component's bundle.
 */
export function ResumeThumbnail({
  template,
  model,
  className,
}: {
  template: ResolvedTemplate;
  model: ResumeRenderModel;
  className?: string;
}) {
  const renderModel = model;
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / SHEET_WIDTH_PX);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: "210 / 297", overflow: "hidden", background: "#fff" }}
      aria-hidden
    >
      <div style={{ position: "absolute", inset: 0, width: SHEET_WIDTH_PX, transform: `scale(${scale || 0.001})`, transformOrigin: "top left" }}>
        <ResumeDocumentView model={renderModel} spec={template} accentColor={template.accentColor} density="print" />
      </div>
    </div>
  );
}

export default ResumeThumbnail;
