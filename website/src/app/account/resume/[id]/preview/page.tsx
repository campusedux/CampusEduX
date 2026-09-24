import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, FileText, PencilRuler } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getPublicSupabase } from "@/lib/supabase/server";
import { mapResumeRow } from "@/lib/resumeBuilder/types";
import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { templateSpec } from "@/lib/resumeBuilder/templateSpecs";
import { resolveDesign, effectiveAccent } from "@/lib/resumeBuilder/design";
import { ResumeDocumentView } from "@/components/resumeBuilder/ResumeDocumentView";
import { ResumeSheetScaler } from "@/components/resumeBuilder/ResumeSheetScaler";

export const metadata = { title: "Resume preview" };

export default async function ResumePreviewPage({ params }: { params: { id: string } }) {
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
  const publicSupabase = getPublicSupabase();
  const { data: templateRow } = publicSupabase
    ? await publicSupabase.from("resume_templates").select("accent_color").eq("id", resume.template).maybeSingle()
    : { data: null };
  const accentColor = templateRow?.accent_color ?? "#4F39F6";

  const model = buildResumeRenderModel({ personalDetails: resume.personalDetails, content: resume.content });
  const spec = resolveDesign(templateSpec(resume.template), resume.design);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[1.6rem] font-bold tracking-tight text-ink">{resume.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">This is exactly what your downloaded résumé will look like.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/account/resume/${resume.id}/edit`} className="btn-ghost">
            <PencilRuler className="h-4 w-4" aria-hidden /> Edit
          </Link>
          <a href={`/api/resume/export/docx?resumeId=${resume.id}`} className="btn-ghost">
            <FileText className="h-4 w-4" aria-hidden /> DOCX
          </a>
          <a href={`/api/resume/export/pdf?resumeId=${resume.id}`} className="btn-primary">
            <Download className="h-4 w-4" aria-hidden /> Download PDF
          </a>
        </div>
      </div>

      {/* The paper itself renders inside ResumeDocumentView's theme-light island. */}
      <div className="rounded-3xl border border-line bg-surface p-3 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <ResumeSheetScaler>
            <ResumeDocumentView model={model} spec={spec} accentColor={effectiveAccent(accentColor, resume.design)} />
          </ResumeSheetScaler>
        </div>
      </div>
    </div>
  );
}
