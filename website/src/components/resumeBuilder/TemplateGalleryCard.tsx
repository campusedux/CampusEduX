"use client";

import { Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ResumeThumbnail } from "./ResumeThumbnail";
import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import type { ResumeRenderModel } from "@/lib/resumeBuilder/renderModel";

/** One template in the /resume/templates gallery — a real miniature resume, never an icon. */
export function TemplateGalleryCard({
  template,
  demoModel,
  onPreview,
  onUse,
  pending,
}: {
  template: ResolvedTemplate;
  demoModel: ResumeRenderModel | undefined;
  onPreview: (template: ResolvedTemplate) => void;
  onUse: (templateId: string) => void;
  pending: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg motion-reduce:transform-none",
      )}
    >
      {/* Thumbnail — clicking it opens the full preview */}
      <button
        type="button"
        onClick={() => onPreview(template)}
        className="relative block w-full border-b border-line bg-surface text-left"
        aria-label={`Preview the ${template.label} template`}
      >
        {demoModel && <ResumeThumbnail template={template} model={demoModel} />}
        <span className="absolute left-2.5 top-2.5 flex gap-1.5">
          {template.atsFriendly && <Badge tone="success">ATS</Badge>}
          {template.isPremium && <Badge tone="premium">Premium</Badge>}
        </span>
        {/* Hover overlay (desktop) */}
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-scrim/10 opacity-0 transition group-hover:opacity-100 sm:flex">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-card">
            <Eye className="h-3.5 w-3.5" /> Preview
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="font-display text-base font-bold text-ink">{template.label}</div>
        <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-muted">{template.description}</p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-card text-xs font-semibold text-ink transition hover:bg-surface"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button
            type="button"
            onClick={() => onUse(template.id)}
            disabled={pending}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Use template
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateGalleryCard;
