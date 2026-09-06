import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";

export const revalidate = 300;
export const metadata = { title: "Premium Projects" };

export default async function PremiumProjectsPage() {
  const supabase = getPublicSupabase();
  let projects: ProjectCardData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS)
      .eq("is_premium", true)
      .order("created_at", { ascending: false })
      // Landing page, no pagination of its own — bound the query.
      .limit(48);
    projects = (data ?? []) as ProjectCardData[];
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink">Premium Projects</h1>
      <p className="mt-2 text-ink-muted">Curated, higher-tier projects — included with a CampusEduX Premium membership.</p>
      <ProjectGrid projects={projects} emptyTitle="No premium projects listed yet" />
    </div>
  );
}
