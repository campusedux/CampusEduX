import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileUp, ShieldCheck, Sparkles } from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getPublicSupabase } from "@/lib/supabase/server";
import { Button, SectionHeader } from "@/components/ui";
import { mapResumeRow } from "@/lib/resumeBuilder/types";
import { computeCompletion } from "@/lib/resumeBuilder/content";
import { DEFAULT_RESOLVED_TEMPLATES, resolveTemplate, templateSpec, type ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import { TemplateShowcaseCard } from "@/components/resumeBuilder/TemplateShowcaseCard";
import { ResumeDashboard, type DashboardResume } from "@/components/resumeBuilder/ResumeDashboard";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";

const DESCRIPTION =
  "Build an ATS-friendly résumé on CampusEduX — pick a template, start from real demo content, track your ATS score, and export a polished PDF.";

export const metadata: Metadata = {
  title: "Resume Builder",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/resume") },
  openGraph: {
    title: "Resume Builder | CampusEduX",
    description: DESCRIPTION,
    url: absoluteUrl("/resume"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};
export const dynamic = "force-dynamic";

function tally(rows: { resume_id: string | null }[] | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows ?? []) if (r.resume_id) map.set(r.resume_id, (map.get(r.resume_id) ?? 0) + 1);
  return map;
}

async function loadTemplates(): Promise<ResolvedTemplate[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return DEFAULT_RESOLVED_TEMPLATES;
  const { data } = await supabase
    .from("resume_templates")
    .select("id,name,description,is_premium,accent_color")
    .eq("status", "active")
    .order("sort_order");
  return data && data.length > 0 ? data.map(resolveTemplate) : DEFAULT_RESOLVED_TEMPLATES;
}

function NewResumeStrip({ templates }: { templates: ResolvedTemplate[] }) {
  return (
    <section className="mt-10">
      <SectionHeader title="Start a new résumé" viewAllHref="/resume/templates" />
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        Every template opens with a complete, realistic demo résumé — edit it in place, or clear it and make it yours.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((t) => (
          <TemplateShowcaseCard key={t.id} template={t} />
        ))}
      </div>
    </section>
  );
}

export default async function ResumeBuilderPage() {
  // Independent: the session check and the public template catalog.
  const [user, templates] = await Promise.all([getOptionalUser(), loadTemplates()]);

  if (!user) {
    return (
      <div className="page-shell">
        <section className="relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-10 shadow-card sm:px-10 sm:py-14">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,#000_15%,transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent-amber/15 blur-3xl" />
          <p className="eyebrow relative">CampusEduX Résumé Builder</p>
          <h1 className="h-display relative mt-4 max-w-3xl">
            Pick a template, start from a real résumé, <span className="text-gradient">ship a PDF.</span>
          </h1>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Button href="/resume/templates" size="lg" rightIcon={ArrowRight}>
              Browse templates
            </Button>
            <Button href={`/login?next=${encodeURIComponent("/resume")}`} size="lg" variant="ghost">
              Sign in to build
            </Button>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "Real demo content", body: "Start with a filled-in résumé for your target role, then make it yours." },
            { icon: ShieldCheck, title: "ATS score", body: "A live, rule-based score with keyword / skills / formatting / readability breakdown." },
            { icon: FileUp, title: "Import or upload", body: "Pull in your CampusEduX profile, or upload an existing PDF/DOCX to parse." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <div className="mt-3 font-bold text-ink">{f.title}</div>
                <p className="mt-1 text-sm text-ink-muted">{f.body}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-12">
          <SectionHeader title="Templates" viewAllHref="/resume/templates" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <TemplateShowcaseCard key={t.id} template={t} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  const supabase = createAuthedServerSupabase();
  const publicSupabase = getPublicSupabase();
  const [{ data: rows }, { data: versionRows }, { data: downloadRows }, { data: downloads }, { data: templateRows }] =
    await Promise.all([
      supabase
        .from("resumes_builder")
        .select("id, title, template, design, is_demo, personal_details, content, education, skills, sections, ats_score, layout, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase.from("resume_versions").select("resume_id").eq("user_id", user.id),
      supabase.from("resume_downloads").select("resume_id").eq("user_id", user.id),
      supabase.from("resume_downloads").select("id, resume_title, downloaded_at").eq("user_id", user.id).order("downloaded_at", { ascending: false }).limit(10),
      publicSupabase
        ? publicSupabase.from("resume_templates").select("id, name")
        : Promise.resolve({ data: null }),
    ]);

  const templateName = new Map(
    ((templateRows ?? []) as { id: string; name: string }[]).map((t) => [t.id, t.name]),
  );
  const versionCount = tally(versionRows);
  const downloadCount = tally(downloadRows);

  const resumes: DashboardResume[] = (rows ?? []).map((row) => {
    const doc = mapResumeRow(row);
    return {
      id: doc.id,
      title: doc.title,
      templateLabel: templateName.get(doc.template) ?? templateSpec(doc.template).label,
      atsScore: doc.atsScore,
      updatedAt: doc.updatedAt,
      completion: computeCompletion(doc.content, doc.personalDetails),
      versions: versionCount.get(doc.id) ?? 0,
      downloads: downloadCount.get(doc.id) ?? 0,
      isDemo: doc.isDemo,
    };
  });

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Résumé Builder</p>
          <h1 className="mt-2 font-display text-[1.9rem] font-bold tracking-tight text-ink">Your résumés</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Your résumés stay in sync between here and the CampusEduX app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/account/resume/import" className="btn-ghost">
            <FileUp className="h-4 w-4" aria-hidden /> Upload existing résumé
          </Link>
          <Button href="/resume/templates">New résumé</Button>
        </div>
      </div>

      <div className="mt-6">
        <ResumeDashboard resumes={resumes} downloads={downloads ?? []} />
      </div>

      <NewResumeStrip templates={templates} />
    </div>
  );
}
