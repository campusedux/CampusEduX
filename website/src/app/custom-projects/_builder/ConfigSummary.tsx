import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  PLATFORM_LABELS,
  TYPE_LABELS,
  LEVEL_LABELS,
  type Platform,
  type ProjectLevel,
  type ProjectType,
} from "@/lib/customProjects";

/**
 * Project Summary card — Project Name / Level / Platform + a concise AI (or
 * fallback) overview, shown at the top of Features & Files (spec §4).
 */
export function ConfigSummary({
  projectType,
  projectLevel,
  platform,
  title,
  editHref = "/custom-projects/start",
  editLabel = "Edit details",
}: {
  projectType: ProjectType;
  projectLevel: ProjectLevel;
  platform: Platform;
  title: string;
  overview?: string;
  editHref?: string;
  /** Section label shown above the project name — customize per page so the same card reads correctly on Features / Estimate / Payment (spec: one consistent summary style). */
  eyebrow?: string;
  editLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-ink">{title || "Untitled project"}</span>
        {[LEVEL_LABELS[projectLevel], PLATFORM_LABELS[platform], TYPE_LABELS[projectType]].map((label) => (
          <span key={label} className="rounded-lg bg-surface px-2 py-1 text-xs text-ink-muted">{label}</span>
        ))}
      </div>
      <Link href={editHref} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline">
        <Pencil className="h-3 w-3" aria-hidden />{editLabel}
      </Link>
    </div>
  );
}
export default ConfigSummary;
