import Link from "next/link";
import { Badge } from "@/components/ui";
import { ResumeThumbnail } from "./ResumeThumbnail";
import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";

/** Non-interactive template card for marketing surfaces — a real thumbnail that links into the gallery. */
export function TemplateShowcaseCard({ template }: { template: ResolvedTemplate }) {
  return (
    <Link
      href="/resume/templates"
      className="group block overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg motion-reduce:transform-none"
    >
      <div className="relative border-b border-line bg-surface">
        <ResumeThumbnail template={template} />
        {template.atsFriendly && (
          <span className="absolute left-2.5 top-2.5">
            <Badge tone="success">ATS</Badge>
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="truncate text-sm font-semibold text-ink">{template.label}</div>
        <div className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{template.description}</div>
      </div>
    </Link>
  );
}

export default TemplateShowcaseCard;
