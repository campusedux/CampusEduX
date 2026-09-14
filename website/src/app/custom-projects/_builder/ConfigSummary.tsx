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
  overview,
  editHref = "/custom-projects/start",
  eyebrow = "Project features & requirements",
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
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
          <h2 className="mt-1 truncate text-xl font-bold text-ink" title={title}>
            {title || "Untitled project"}
          </h2>
        </div>
        <Link
          href={editHref}
          className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-ink-muted underline decoration-line underline-offset-2 hover:text-primary"
        >
          <Pencil className="h-3 w-3" aria-hidden />
          {editLabel}
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface px-3 py-2">
          <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-faint">Level</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink">{LEVEL_LABELS[projectLevel]}</dd>
        </div>
        <div className="rounded-xl bg-surface px-3 py-2">
          <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-faint">Platform</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink">{PLATFORM_LABELS[platform]}</dd>
        </div>
        <div className="rounded-xl bg-surface px-3 py-2">
          <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-faint">Type</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink">{TYPE_LABELS[projectType]}</dd>
        </div>
      </dl>

      {overview && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-faint">Project overview</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{overview}</p>
        </div>
      )}
    </div>
  );
}

export default ConfigSummary;
