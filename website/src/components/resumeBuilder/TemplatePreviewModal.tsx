"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { ResumeDocumentView, SHEET_WIDTH_PX, SHEET_MIN_HEIGHT_PX } from "./ResumeDocumentView";
import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import type { ResumeRenderModel } from "@/lib/resumeBuilder/renderModel";

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.15;

/** Full-screen A4 preview of a template — opened from a gallery card's "Preview". */
export function TemplatePreviewModal({
  template,
  model,
  persona,
  onClose,
  onUse,
  pending,
}: {
  template: ResolvedTemplate | null;
  model: ResumeRenderModel | null;
  persona: string;
  onClose: () => void;
  onUse: (templateId: string) => void;
  pending: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.7);
  const [zoomMult, setZoomMult] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (!template) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [template, onClose]);

  useLayoutEffect(() => {
    if (!template) return;
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const usable = stage.clientWidth - 48;
      setFitScale(Math.max(0.3, Math.min(1, usable / SHEET_WIDTH_PX)));
      if (sheetRef.current) setPages(Math.max(1, Math.ceil(sheetRef.current.offsetHeight / SHEET_MIN_HEIGHT_PX)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    if (sheetRef.current) ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, [template]);

  if (!template || !model) return null;

  const scale = fitScale * zoomMult;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-ink/70" role="dialog" aria-modal="true" aria-label={`${template.label} template preview`}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-base font-bold text-ink">{template.label}</span>
          {template.atsFriendly && <Badge tone="success">ATS friendly</Badge>}
          {template.isPremium && <Badge tone="premium">Premium</Badge>}
          <span className="hidden text-xs text-ink-faint sm:inline">Demo: {persona} · ~{pages} page{pages > 1 ? "s" : ""} · A4</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomMult((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
            className="rounded-lg p-2 text-ink-muted hover:bg-surface"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-ink-muted">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoomMult((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
            className="rounded-lg p-2 text-ink-muted hover:bg-surface"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="ml-1 rounded-lg p-2 text-ink-muted hover:bg-surface" aria-label="Close preview">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div ref={stageRef} className="flex-1 overflow-auto px-4 py-6 sm:px-6" onClick={onClose}>
        <div style={{ width: SHEET_WIDTH_PX * scale, minWidth: "min-content" }} className="mx-auto" onClick={(e) => e.stopPropagation()}>
          <div style={{ height: (sheetRef.current?.offsetHeight ?? SHEET_MIN_HEIGHT_PX) * scale }}>
            <div
              ref={sheetRef}
              style={{ width: SHEET_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}
            >
              <ResumeDocumentView model={model} spec={template} accentColor={template.accentColor} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white px-4 py-3 sm:px-6">
        <p className="hidden text-xs text-ink-faint sm:block">{template.description}</p>
        <button
          type="button"
          onClick={() => onUse(template.id)}
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Use this template
        </button>
      </div>
    </div>
  );
}

export default TemplatePreviewModal;
