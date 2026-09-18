import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

async function getTrendingProjects(): Promise<ProjectCardData[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_LIST_FIELDS)
    .order("sales_count", { ascending: false })
    .limit(48);
  return (data ?? []) as ProjectCardData[];
}

export async function generateMetadata(): Promise<Metadata> {
  const projects = await getTrendingProjects();
  return {
    title: "Trending Projects",
    alternates: { canonical: absoluteUrl("/projects/trending") },
    // No trending projects yet -> don't index an empty shell page.
    robots: projects.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function TrendingPage() {
  const projects = await getTrendingProjects();
  return (
    <div className="page-shell">
      <h1 className="text-3xl font-bold text-ink">Trending Projects</h1>
      <ProjectGrid projects={projects} showRank emptyTitle="No trending projects yet" />
    </div>
  );
}
