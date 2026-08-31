import { getPublicSupabase } from "@/lib/supabase/server";
import { ResumeTemplateCard, type ResumeTemplateData, Button, SectionHeader } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";

export const revalidate = 300;
export const metadata = { title: "Resume Builder" };

const POINTS = [
  "Guided personal details, education, skills and experience sections",
  "Live ATS score with a breakdown of what to improve",
  "Multiple templates to choose from",
  "PDF export and a history of past downloads",
];

export default async function ResumePage() {
  const supabase = getPublicSupabase();
  let templates: ResumeTemplateData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("resume_templates")
      .select("id,name,description,is_premium,accent_color")
      .eq("status", "active")
      .order("sort_order")
      .limit(4);
    templates = (data ?? []).map((t: { id: string; name: string; description?: string | null; is_premium?: boolean | null }) => ({
      id: t.id,
      name: t.name,
      category: t.description ?? null,
      is_ats_friendly: !t.is_premium,
    }));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Resume Builder</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        A guided resume builder in the CampusEduX app: fill in education, projects, skills and experience in structured
        sections, watch an ATS-friendliness score as you go, and export a clean PDF when it&apos;s ready.
      </p>
      <ul className="mt-6 space-y-2">
        {POINTS.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-ink-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Button href="/resume/templates" variant="secondary">
          View all templates
        </Button>
      </div>

      {templates.length > 0 && (
        <div className="mt-12">
          <SectionHeader title="Templates" viewAllHref="/resume/templates" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <ResumeTemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
