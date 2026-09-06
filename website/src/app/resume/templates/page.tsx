import { getPublicSupabase } from "@/lib/supabase/server";
import { DEFAULT_RESOLVED_TEMPLATES, resolveTemplate, type ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import { TemplateGallery } from "./TemplateGallery";

export const revalidate = 300;
export const metadata = { title: "Resume Templates" };

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

  return (
    <div className="container-page py-10">
      <TemplateGallery templates={templates} />
    </div>
  );
}
