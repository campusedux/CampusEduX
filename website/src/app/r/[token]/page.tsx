import { notFound } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase/server";
import { buildResumeRenderModel, type ResumeRenderInput } from "@/lib/resumeBuilder/renderModel";
import ReportShareButton from "./ReportShareButton";

export const dynamic = "force-dynamic";

interface SharedResumePayload extends ResumeRenderInput {
  title: string;
  template: string;
}

export default async function SharedResumePage({ params }: { params: { token: string } }) {
  const supabase = getPublicSupabase();
  if (!supabase) notFound();

  const { data, error } = await supabase.rpc("get_shared_resume", { p_token: params.token });
  if (error || !data) notFound();

  const shared = data as SharedResumePayload;
  const { data: templateRow } = await supabase.from("resume_templates").select("accent_color").eq("id", shared.template).maybeSingle();
  const accentColor = templateRow?.accent_color ?? "#4F39F6";

  const model = buildResumeRenderModel(shared);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-card" style={{ borderTop: `4px solid ${accentColor}` }}>
        <h1 className="text-2xl font-bold text-ink">{model.fullName}</h1>
        {model.jobTitle && (
          <p className="text-sm font-medium" style={{ color: accentColor }}>
            {model.jobTitle}
          </p>
        )}
        {model.contactLine && <p className="mt-1 text-xs text-ink-faint">{model.contactLine}</p>}

        <div className="mt-6 space-y-5">
          {model.blocks.map((block) => (
            <div key={block.key}>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>
                {block.heading}
              </h2>
              {block.lines.map((line, index) => (
                <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-ink-faint">Shared via CampusEduX</p>
        <ReportShareButton token={params.token} />
      </div>
    </div>
  );
}
