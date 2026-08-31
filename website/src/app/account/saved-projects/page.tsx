import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { EmptyState, Button } from "@/components/ui";

export const metadata = { robots: { index: false, follow: false }, title: "Saved projects" };

export default async function SavedProjectsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data } = await supabase
    .from("wishlists")
    .select("project:projects(id,title,category_name,tech_stack,price,rating,review_count,thumbnail_url,is_premium,is_best_seller)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const projects = (data ?? [])
    .map((r) => (Array.isArray(r.project) ? r.project[0] : r.project))
    .filter(Boolean) as unknown as ProjectCardData[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Saved projects</h1>
      {projects.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No saved projects yet"
          subtitle="Tap the heart on any project to keep it here."
          action={<Button href="/projects" size="sm">Browse the marketplace</Button>}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
