import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";

export const revalidate = 300;
export const metadata = { title: "Best Selling Projects" };

export default async function BestSellersPage() {
  const supabase = getPublicSupabase();
  let projects: ProjectCardData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS)
      .eq("is_best_seller", true)
      .order("sales_count", { ascending: false });
    projects = (data ?? []) as ProjectCardData[];
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Best Sellers</h1>
      <p className="mt-2 text-ink-muted">Consistently top-selling projects on the platform.</p>
      <ProjectGrid projects={projects} showRank emptyTitle="No best-seller projects flagged yet" />
    </div>
  );
}
