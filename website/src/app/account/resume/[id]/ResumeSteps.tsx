"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Download, FolderKanban, GitCompare, History, PencilRuler, ScanSearch } from "lucide-react";
import { cn } from "@/lib/cn";

interface Step {
  slug: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

/** The per-résumé pages, in the order a student naturally works through them. */
const STEPS: Step[] = [
  { slug: "edit", label: "Edit content", short: "Edit", icon: PencilRuler },
  { slug: "projects", label: "Add projects", short: "Projects", icon: FolderKanban },
  { slug: "ats", label: "ATS check", short: "ATS", icon: ScanSearch },
  { slug: "jd-match", label: "Match a job", short: "Job match", icon: GitCompare },
  { slug: "versions", label: "Versions", short: "Versions", icon: History },
  { slug: "preview", label: "Preview & download", short: "Download", icon: Download },
];

function useStepIndex(): number {
  const pathname = usePathname();
  const seg = pathname.split("/")[4] ?? "";
  return Math.max(0, STEPS.findIndex((s) => s.slug === seg));
}

/**
 * Step indicator across the résumé pages. Pure navigation — it shows where you
 * are in the flow, not saved state (the editor autosaves on its own).
 */
export function ResumeSteps({ resumeId }: { resumeId: string }) {
  const current = useStepIndex();
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/resume" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Your résumés
        </Link>
        <span className="text-xs font-semibold text-ink-faint">
          Step {current + 1} of {STEPS.length}
        </span>
      </div>
      <nav aria-label="Résumé steps" className="mt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ol className="flex min-w-max items-center gap-1 rounded-2xl border border-line bg-card p-1.5 shadow-card">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === current;
            const passed = i < current;
            return (
              <li key={s.slug} className="flex items-center">
                <Link
                  href={`/account/resume/${resumeId}/${s.slug}`}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    active ? "bg-primary text-white shadow-glow" : passed ? "text-primary hover:bg-primary-50" : "text-ink-muted hover:bg-surface hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                      active ? "bg-white/20" : passed ? "bg-primary-50" : "bg-surface",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.short}</span>
                </Link>
                {i < STEPS.length - 1 && <span aria-hidden className="mx-0.5 h-px w-3 bg-line" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

/** Back / Next between résumé steps, at the bottom of every step page. */
export function ResumeStepFooter({ resumeId }: { resumeId: string }) {
  const current = useStepIndex();
  const prev = STEPS[current - 1];
  const next = STEPS[current + 1];
  return (
    <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
      {prev ? (
        <Link href={`/account/resume/${resumeId}/${prev.slug}`} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/account/resume/${resumeId}/${next.slug}`} className="btn-primary">
          Next: {next.label} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <Link href="/resume" className="btn-secondary">
          Done — back to your résumés
        </Link>
      )}
    </div>
  );
}
