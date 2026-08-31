import Image from "next/image";
import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

export type ResumeTemplateData = {
  id: string;
  name: string;
  category?: string | null;
  preview_url?: string | null;
  is_ats_friendly?: boolean | null;
};

/** Resume template preview tile. */
export function ResumeTemplateCard({ template, className }: { template: ResumeTemplateData; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-white shadow-card", className)}>
      <div className="relative flex aspect-[3/4] items-center justify-center bg-surface">
        {template.preview_url ? (
          <Image
            src={template.preview_url}
            alt={template.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <FileText className="h-10 w-10 text-ink-faint" aria-hidden />
        )}
        {template.is_ats_friendly && (
          <span className="absolute left-2 top-2">
            <Badge tone="success">ATS</Badge>
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="truncate text-sm font-semibold text-ink">{template.name}</div>
        {template.category && <div className="mt-0.5 truncate text-xs text-ink-faint">{template.category}</div>}
      </div>
    </div>
  );
}

export default ResumeTemplateCard;
