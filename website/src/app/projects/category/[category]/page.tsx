import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { getCachedCategoryPreview, getCachedCategoryIds } from "@/lib/cache";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

// This landing page has no pagination of its own; cap it and point at the
// fully paginated marketplace view (/projects?category=<id>) for the rest.
const CATEGORY_PREVIEW_LIMIT = 48;

// ISR: prerender every category page; long tail renders on demand + caches.
export async function generateStaticParams() {
  return (await getCachedCategoryIds()).map((category) => ({ category }));
}

const getData = cache(async (categoryId: string) => {
  const res = await getCachedCategoryPreview(categoryId);
  return { name: res.name, projects: res.projects as ProjectCardData[] };
});

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const { name } = await getData(params.category);
  const description = `${name} projects on CampusEduX — browse student-built final-year and mini projects in this category.`;
  const url = absoluteUrl(`/projects/category/${encodeURIComponent(params.category)}`);
  return {
    title: `${name} projects`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${name} projects | CampusEduX`, description, url, type: "website" },
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const { name, projects } = await getData(params.category);
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <h1 className="text-3xl font-bold text-ink">{name}</h1>
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
