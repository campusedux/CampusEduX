import { getPublicSupabase } from "@/lib/supabase/server";
import { ResumeTemplateCard, type ResumeTemplateData, EmptyState } from "@/components/ui";

export const revalidate = 300;
export const metadata = { title: "Resume Templates" };

export default async function ResumeTemplatesPage() {
  const supabase = getPublicSupabase();
  let templates: ResumeTemplateData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("resume_templates")
      .select("id,name,description,is_premium")
      .eq("status", "active")
      .order("sort_order");
    templates = (data ?? []).map((t: { id: string; name: string; description?: string | null; is_premium?: boolean | null }) => ({
      id: t.id,
      name: t.name,
      category: t.description ?? null,
      is_ats_friendly: !t.is_premium,
    }));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Resume Templates</h1>
      <p className="mt-2 text-ink-muted">Pick a template in the app when you build your resume.</p>
      {templates.length === 0 ? (
        <EmptyState className="mt-8" title="No templates published yet" />
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <ResumeTemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}
