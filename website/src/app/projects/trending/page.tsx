import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";

export const revalidate = 300;
export const metadata = { title: "Trending Projects" };

export default async function TrendingPage() {
  const supabase = getPublicSupabase();
  let projects: ProjectCardData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS)
      .order("sales_count", { ascending: false })
      .limit(48);
    projects = (data ?? []) as ProjectCardData[];
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink">Trending Projects</h1>
      <p className="mt-2 text-ink-muted">The most-bought projects on CampusEduX right now.</p>
      <ProjectGrid projects={projects} showRank emptyTitle="No trending projects yet" />
    </div>
  );
}
