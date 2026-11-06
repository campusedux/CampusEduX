import { completeSeoMetadata } from "@/lib/seo";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProjectCardData } from "@/components/ProjectCard";
import { ProjectGrid } from "@/components/marketplace/ProjectGrid";
import { getCachedCategoryPreview, getCachedCategoryIds } from "@/lib/cache";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { Breadcrumb } from "@/components/ui";

// Request-specific CSP nonces cannot be reused in statically cached HTML.
// Existing data-layer caches still serve public content reads.
export const dynamic = "force-dynamic";
export const revalidate = 300;

// This landing page has no pagination of its own; cap it and point at the
// fully paginated marketplace view (/projects?category=<id>) for the rest.
const CATEGORY_PREVIEW_LIMIT = 48;

// Known category enumeration; HTML renders per request for nonce safety.
export async function generateStaticParams() {
  return (await getCachedCategoryIds()).map((category) => ({ category }));
}

const getData = cache(async (categoryId: string) => {
  const res = await getCachedCategoryPreview(categoryId);
  // `found: false` = no such category row. Answer with a real 404 instead of a
  // 200 "soft 404" whose heading is the raw id.
  return { name: res.name, projects: res.projects as ProjectCardData[], missing: res.found === false };
});

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const { name, projects, missing } = await getData(params.category);
  if (missing)
    return completeSeoMetadata({
      title: "Category not found",
      robots: { index: false, follow: false },
    });
  const description = `${name} projects on CampusEduX — browse educational source-code examples in this category.`;
  const url = absoluteUrl(
    `/projects/category/${encodeURIComponent(params.category)}`,
  );
  return completeSeoMetadata({
    title: `${name} projects`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${name} projects | CampusEduX`, description, url, type: "website", images: [DEFAULT_OG_IMAGE] },
    // No projects in this category yet -> don't index an empty shell page.
    robots: projects.length === 0 ? { index: false, follow: true } : undefined,
  });
}

export default async function CategoryPage({ params: paramsPromise }: { params: Promise<{ category: string }> }) {
  const params = await paramsPromise;
  const { name, projects, missing } = await getData(params.category);
  if (missing) notFound();
  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projects", path: "/projects" },
          { name, path: `/projects/category/${encodeURIComponent(params.category)}` },
        ])}
      />
      <Breadcrumb className="mb-5" items={[{ label: "Projects", href: "/projects" }, { label: name }]} />
      <p className="eyebrow">Category</p>
      <h1 className="h-hero mt-2">{name}</h1>
      <ProjectGrid projects={projects} emptyTitle="No projects in this category yet" />
      {projects.length >= CATEGORY_PREVIEW_LIMIT && (
        <div className="mt-10 flex justify-center">
          <Link href={`/projects?category=${params.category}`} className="btn-secondary">
            Browse all {name} projects in the marketplace →
          </Link>
        </div>
      )}
    </div>
  );
}
