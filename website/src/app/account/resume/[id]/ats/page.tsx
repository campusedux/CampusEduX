import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { mapResumeRow } from "@/lib/resumeBuilder/types";
import type { ATSBreakdown } from "@/lib/resumeBuilder/types";
import { buildAtsAnalysis, type AtsCategory, type AtsStatus } from "@/lib/resumeBuilder/atsCategories";
import { encodeSectionTarget } from "@/lib/resumeBuilder/content";

function overallLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Needs work";
}

const STATUS_UI: Record<AtsStatus, { text: string; badge: string; bar: string }> = {
  strong: { text: "Strong", badge: "bg-success/15 text-success", bar: "bg-success" },
  ok: { text: "OK", badge: "bg-warning/15 text-warning", bar: "bg-warning" },
  weak: { text: "Needs work", badge: "bg-danger/10 text-danger", bar: "bg-danger" },
};

function CategoryCard({ category, resumeId }: { category: AtsCategory; resumeId: string }) {
  const ui = STATUS_UI[category.status];
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{category.label}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-2xl font-bold text-ink">{category.score}</span>
            <span className="text-xs text-ink-faint">/ 100</span>
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${ui.badge}`}>{ui.text}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div className={`h-full rounded-full ${ui.bar}`} style={{ width: `${category.score}%` }} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {category.good.map((g, i) => (
          <li key={`g-${i}`} className="flex items-start gap-2 text-sm text-ink-muted">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {g}
          </li>
        ))}
        {category.weak.map((w, i) => (
          <li key={`w-${i}`} className="flex items-start gap-2 text-sm text-ink-muted">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" /> {w}
          </li>
        ))}
      </ul>

      {category.suggestions.length > 0 && (
        <div className="mt-3 rounded-xl bg-surface p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">How to improve</p>
          <ul className="mt-1 space-y-1 text-xs text-ink-muted">
            {category.suggestions.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {category.target && (
        <Link
          href={`/account/resume/${resumeId}/edit?section=${encodeSectionTarget(category.target)}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Improve {category.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export default async function ResumeAtsPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: row } = await supabase
    .from("resumes_builder")
    .select("id, title, template, design, is_demo, personal_details, content, education, skills, sections, ats_score, layout, updated_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) notFound();
  const resume = mapResumeRow(row);

  const { data, error } = await supabase.rpc("compute_ats_breakdown", { p_resume_id: params.id });
  const breakdown = error ? null : (data as ATSBreakdown);
  const analysis = breakdown ? buildAtsAnalysis(breakdown, resume.content, resume.personalDetails) : null;

  return (
    <div className="container-page py-10">
      <Link href="/resume" className="text-sm text-ink-muted hover:text-ink">
        &larr; Back to your résumés
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-ink">ATS check — &ldquo;{resume.title}&rdquo;</h1>

      {!analysis ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
          <AlertTriangle className="h-4 w-4 text-danger" /> Couldn&apos;t analyse this résumé right now. Please try again shortly.
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-6 rounded-2xl border border-line bg-white p-6">
            <div className="text-4xl font-bold text-ink">{analysis.overall}</div>
            <div>
              <div className="text-sm font-semibold text-ink">{overallLabel(analysis.overall)}</div>
              <div className="text-xs text-ink-muted">out of 100 · a deterministic score, recomputed from your résumé&apos;s real content</div>
            </div>
            <Link href={`/account/resume/${resume.id}/jd-match`} className="ml-auto text-sm font-semibold text-primary hover:underline">
              Check against a job →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {analysis.categories.map((c) => (
              <CategoryCard key={c.key} category={c} resumeId={resume.id} />
            ))}
          </div>

          <div className="mt-8">
            <Link href={`/account/resume/${resume.id}/edit`} className="text-sm font-semibold text-primary hover:underline">
              Back to the editor
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
