import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Trending Projects",
  alternates: { canonical: absoluteUrl("/projects/trending") },
};

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
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <h1 className="text-3xl font-bold text-ink">Trending Projects</h1>
      <ProjectGrid projects={projects} showRank emptyTitle="No trending projects yet" />
    </div>
  );
}
