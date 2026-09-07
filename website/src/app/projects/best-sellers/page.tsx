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
      .order("sales_count", { ascending: false })
      // Landing page, no pagination of its own — bound the query.
      .limit(48);
    projects = (data ?? []) as ProjectCardData[];
  }
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <h1 className="text-3xl font-bold text-ink">Best Sellers</h1>
      <ProjectGrid projects={projects} showRank emptyTitle="No best-seller projects flagged yet" />
    </div>
  );
}
