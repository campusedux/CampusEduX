import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";

export const revalidate = 300;
export const metadata = { title: "New Arrivals" };

export default async function NewArrivalsPage() {
  const supabase = getPublicSupabase();
  let projects: ProjectCardData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS)
      .order("created_at", { ascending: false })
      .limit(48);
    projects = (data ?? []) as ProjectCardData[];
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink">New Arrivals</h1>
      <p className="mt-2 text-ink-muted">Freshly listed projects from the CampusEduX community.</p>
      <ProjectGrid projects={projects} emptyTitle="No new projects yet" />
    </div>
  );
}
