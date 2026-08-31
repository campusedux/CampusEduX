import { getPublicSupabase } from "@/lib/supabase/server";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";

export const revalidate = 300;
export const metadata = { title: "Trending Projects" };

export default async function TrendingPage() {
  const supabase = getPublicSupabase();
  let projects: ProjectCardData[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("projects")
      .select("id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller")
      .order("sales_count", { ascending: false })
      .limit(48);
    projects = (data ?? []) as ProjectCardData[];
  }
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Trending Projects</h1>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
    </div>
  );
}
