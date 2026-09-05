import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import type { ATSBreakdown } from "@/lib/resumeBuilder/types";

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Needs work";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink-faint">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-lg bg-primary/10">
        <div className="h-1.5 rounded-lg bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default async function ResumeAtsPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: resume } = await supabase.from("resumes_builder").select("id, title").eq("id", params.id).eq("user_id", user.id).maybeSingle();
  if (!resume) notFound();

  const { data, error } = await supabase.rpc("compute_ats_breakdown", { p_resume_id: params.id });
  const breakdown = error ? null : (data as ATSBreakdown);

  return (
    <div className="container-prose py-12">
      <Link href="/account/resume" className="text-sm text-ink-muted hover:text-ink">
        &larr; Back to your resumes
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-ink">ATS score — &ldquo;{resume.title}&rdquo;</h1>

      {!breakdown ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
          <AlertTriangle className="h-4 w-4 text-danger" /> Couldn&apos;t analyze this resume right now. Please try again shortly.
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-6 rounded-2xl border border-line bg-white p-6">
            <div className="text-4xl font-bold text-ink">{breakdown.overall}</div>
            <div>
              <div className="text-sm font-semibold text-ink">{scoreLabel(breakdown.overall)}</div>
              <div className="text-xs text-ink-muted">out of 100, recomputed from your resume&apos;s real content</div>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6">
            <ScoreBar label="Content" value={breakdown.content} />
            <ScoreBar label="Formatting" value={breakdown.formatting} />
            <ScoreBar label="Skills" value={breakdown.skills} />
            <ScoreBar label="Keywords" value={breakdown.keywords} />
          </div>

          <div className="mt-6 space-y-3">
            {breakdown.tips.map((tip, index) => (
              <div key={tip.ruleId ?? `tip-${index}`} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
                {tip.ruleId === null ? (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                )}
                <div>
                  <p className="text-sm font-semibold text-ink">{tip.problem}</p>
                  {tip.why && <p className="mt-0.5 text-xs text-ink-muted">{tip.why}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={`/account/resume/${resume.id}/edit`} className="text-sm font-semibold text-primary hover:underline">
              Edit this resume
            </Link>
            <Link href={`/account/resume/${resume.id}/jd-match`} className="text-sm font-semibold text-primary hover:underline">
              Check against a job description
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
