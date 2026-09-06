import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";

export const revalidate = 300;

// This landing page has no pagination of its own; cap it and point at the
// fully paginated marketplace view (/projects?category=<id>) for the rest.
const CATEGORY_PREVIEW_LIMIT = 48;

async function getData(categoryId: string) {
  const supabase = getPublicSupabase();
  if (!supabase) return { name: categoryId, projects: [] as ProjectCardData[] };
  const [{ data: cat }, { data }] = await Promise.all([
    supabase.from("categories").select("name").eq("id", categoryId).maybeSingle(),
    supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false })
      .limit(CATEGORY_PREVIEW_LIMIT),
  ]);
  return { name: cat?.name ?? categoryId, projects: (data ?? []) as ProjectCardData[] };
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const { name } = await getData(params.category);
  return { title: `${name} projects` };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { name, projects } = await getData(params.category);
  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-ink">{name}</h1>
      <p className="mt-2 text-ink-muted">Projects listed under {name}.</p>
      <ProjectGrid projects={projects} emptyTitle="No projects in this category yet" />
      {projects.length >= CATEGORY_PREVIEW_LIMIT && (
        <p className="mt-8 text-sm">
          <Link
            href={`/projects?category=${params.category}`}
            className="font-semibold text-primary hover:underline"
          >
            Browse all {name} projects in the marketplace →
          </Link>
        </p>
      )}
    </div>
  );
}
