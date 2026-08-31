import { getPublicSupabase } from "@/lib/supabase/server";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";

export const metadata = { title: "Project Marketplace" };
export const revalidate = 120;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const supabase = getPublicSupabase();
  let projects: ProjectCardData[] = [];

  if (supabase) {
    let query = supabase
      .from("projects")
      .select("id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller")
      .order("created_at", { ascending: false })
      .limit(48);

    if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
    if (searchParams.category) query = query.eq("category_id", searchParams.category);

    const { data } = await query;
    projects = (data ?? []) as ProjectCardData[];
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Project Marketplace</h1>
      <p className="mt-2 max-w-2xl text-slate">
        Browse academic, personal and business projects listed by the CampusEduX community. Filter by category, or search by title.
      </p>

      <form className="mt-6 flex gap-3" action="/projects" method="get">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search projects…"
          className="w-full max-w-md border border-navy/20 bg-white px-3 py-2 text-sm"
        />
        <button className="border border-navy px-4 py-2 text-sm text-navy hover:bg-navy hover:text-paper">Search</button>
      </form>

      {projects.length === 0 ? (
        <div className="empty-state mt-8">
          No projects match this search yet — try a different keyword, or check back once the catalog is connected.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
