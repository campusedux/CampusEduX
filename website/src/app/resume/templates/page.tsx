import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { DEFAULT_RESOLVED_TEMPLATES, resolveTemplate, type ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import { demoRenderModel, demoResume } from "@/lib/resumeBuilder/demoResumes";
import { TemplateGallery, type TemplateDemo } from "./TemplateGallery";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "Browse résumé templates on CampusEduX — each one opens with a complete, realistic demo résumé you can edit or clear and make your own.";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Resume Templates",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/resume/templates") },
  openGraph: {
    title: "Resume Templates | CampusEduX",
    description: DESCRIPTION,
    url: absoluteUrl("/resume/templates"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

type TemplateRow = { id: string; name: string | null; description: string | null; accent_color: string | null; is_premium: boolean | null };

export default async function ResumeTemplatesPage() {
  const supabase = getPublicSupabase();
  let templates: ResolvedTemplate[] = DEFAULT_RESOLVED_TEMPLATES;

  if (supabase) {
    const { data } = await supabase
      .from("resume_templates")
      .select("id,name,description,accent_color,is_premium")
      .eq("status", "active")
      .order("sort_order");
    if (data && data.length > 0) {
      templates = (data as TemplateRow[]).map(resolveTemplate);
    }
  }

  // Build each template's demo render model on the server so the ~10 kB
  // `demoResumes` data never ships to the client (thumbnails + preview modal
  // receive it as a prop).
  const demos: Record<string, TemplateDemo> = {};
  for (const t of templates) {
    demos[t.id] = { model: demoRenderModel(t.id), persona: demoResume(t.id).persona };
  }

  return (
    <div className="page-shell">
      <TemplateGallery templates={templates} demos={demos} />
    </div>
  );
}
