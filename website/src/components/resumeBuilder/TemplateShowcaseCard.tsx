import Link from "next/link";
import { Badge } from "@/components/ui";
import { ResumeThumbnail } from "./ResumeThumbnail";
import { demoRenderModel } from "@/lib/resumeBuilder/demoResumes";
import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";

/** Non-interactive template card for marketing surfaces — a real thumbnail that links into the gallery.
 *  Server component: the demo render model is built here so `demoResumes` stays off the client. */
export function TemplateShowcaseCard({ template }: { template: ResolvedTemplate }) {
  const model = demoRenderModel(template.id);
  return (
    <Link
      href="/resume/templates"
      className="group card card-hover block overflow-hidden"
    >
      <div className="relative border-b border-line bg-surface">
        <ResumeThumbnail template={template} model={model} />
        {template.atsFriendly && (
          <span className="absolute left-2.5 top-2.5">
            <Badge tone="success">ATS</Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="truncate text-sm font-semibold text-ink">{template.label}</div>
        <div className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{template.description}</div>
      </div>
    </Link>
  );
}

export default TemplateShowcaseCard;
