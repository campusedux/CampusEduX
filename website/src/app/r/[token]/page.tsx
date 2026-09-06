import { notFound } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase/server";
import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { normalizeContent } from "@/lib/resumeBuilder/content";
import { templateSpec } from "@/lib/resumeBuilder/templateSpecs";
import { resolveDesign, effectiveAccent, sanitizeDesign } from "@/lib/resumeBuilder/design";
import { EMPTY_PERSONAL, type ResumePersonalDetails } from "@/lib/resumeBuilder/types";
import { ResumeDocumentView } from "@/components/resumeBuilder/ResumeDocumentView";
import { ResumeSheetScaler } from "@/components/resumeBuilder/ResumeSheetScaler";
import ReportShareButton from "./ReportShareButton";

export const dynamic = "force-dynamic";

interface SharedResumePayload {
  title: string;
  template: string;
  design?: unknown;
  personalDetails: Partial<ResumePersonalDetails>;
  content?: unknown;
  sections?: unknown;
  education?: unknown;
  skills?: unknown;
  layout?: unknown;
}

export default async function SharedResumePage({ params }: { params: { token: string } }) {
  const supabase = getPublicSupabase();
  if (!supabase) notFound();

  const { data, error } = await supabase.rpc("get_shared_resume", { p_token: params.token });
  if (error || !data) notFound();

  const shared = data as SharedResumePayload;
  const { data: templateRow } = await supabase.from("resume_templates").select("accent_color").eq("id", shared.template).maybeSingle();
  const accentColor = templateRow?.accent_color ?? "#4F39F6";

  const content = normalizeContent(shared.content, {
    sections: shared.sections,
    education: shared.education,
    skills: shared.skills,
    layout: shared.layout,
  });
  const model = buildResumeRenderModel({ personalDetails: { ...EMPTY_PERSONAL, ...shared.personalDetails }, content });
  const design = sanitizeDesign(shared.design);
  const spec = resolveDesign(templateSpec(shared.template), design);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ResumeSheetScaler>
        <ResumeDocumentView model={model} spec={spec} accentColor={effectiveAccent(accentColor, design)} />
      </ResumeSheetScaler>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-faint">Shared via CampusEduX</p>
        <ReportShareButton token={params.token} />
      </div>
    </div>
  );
}
