import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { PROJECT_LIST_FIELDS } from "@/lib/marketplace";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";

const DESCRIPTION =
  "The best-selling final-year and mini projects on CampusEduX, ranked by sales — open any project to see its details, screenshots, price and reviews.";
import { Breadcrumb } from "@/components/ui";

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
    description: DESCRIPTION,
    alternates: { canonical: absoluteUrl("/projects/trending") },
    openGraph: {
      title: `Trending Projects | ${BRAND.name}`,
      description: DESCRIPTION,
      url: absoluteUrl("/projects/trending"),
      type: "website",
      siteName: BRAND.name,
      images: [DEFAULT_OG_IMAGE],
    },
    // No trending projects yet -> don't index an empty shell page.
    robots: projects.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function TrendingPage() {
  const projects = await getTrendingProjects();
  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projects", path: "/projects" },
          { name: "Trending", path: "/projects/trending" },
        ])}
      />
      <Breadcrumb className="mb-5" items={[{ label: "Projects", href: "/projects" }, { label: "Trending" }]} />
      <p className="eyebrow">Marketplace</p>
      <h1 className="h-hero mt-2">Trending projects</h1>
      <p className="lede mt-2">The most-bought projects on CampusEduX right now.</p>
      <ProjectGrid projects={projects} showRank emptyTitle="No trending projects yet" />
    </div>
  );
}
