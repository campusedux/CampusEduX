import { notFound } from "next/navigation";
import Link from "next/link";
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/resume" className="text-sm text-ink-muted hover:text-ink">
          &larr; Back to your resumes
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/account/resume/${resume.id}/edit`} className="text-sm font-semibold text-primary hover:underline">
            Edit
          </Link>
          <a href={`/api/resume/export/pdf?resumeId=${resume.id}`} className="text-sm font-semibold text-primary hover:underline">
            Download PDF
          </a>
          <a href={`/api/resume/export/docx?resumeId=${resume.id}`} className="text-sm font-semibold text-primary hover:underline">
            DOCX
          </a>
        </div>
      </div>

      <ResumeSheetScaler>
        <ResumeDocumentView model={model} spec={spec} accentColor={effectiveAccent(accentColor, resume.design)} />
      </ResumeSheetScaler>
    </div>
  );
}
