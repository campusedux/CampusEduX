import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { FilterSheet, Pagination, EmptyState, PageHeader } from "@/components/ui";
import { ProjectFilters } from "@/components/marketplace/ProjectFilters";
import { getCachedProjectsPage, getCachedCategories } from "@/lib/cache";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import {
  PROJECT_PAGE_SIZE,
  PROJECT_SORTS,
  cleanParams,
  parsePage,
  parsePrice,
  projectSort,
  totalPages,
} from "@/lib/marketplace";

const DESCRIPTION =
  "Buy or browse final-year and mini projects on CampusEduX — filter by category, price and rating to find ready-to-submit source code from student sellers.";

export const metadata: Metadata = {
  title: "Project Marketplace",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/projects") },
  openGraph: {
    title: "Project Marketplace | CampusEduX",
    description: DESCRIPTION,
    url: absoluteUrl("/projects"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};
export const revalidate = 120;

type SP = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  flag?: string;
  page?: string;
};

export default async function ProjectsPage({ searchParams }: { searchParams: SP }) {
  const page = parsePage(searchParams.page);
  const sort = projectSort(searchParams.sort);
  const min = parsePrice(searchParams.min);
  const max = parsePrice(searchParams.max);
  const flag = searchParams.flag === "premium" || searchParams.flag === "bestseller" ? searchParams.flag : undefined;

  const s = PROJECT_SORTS[sort];
  // Data is served from a per-filter cross-request cache (lib/cache.ts) — this
  // route stays dynamic to read the URL, but no longer hits Supabase per visit.
  const [{ projects: rows, count }, categories] = await Promise.all([
    getCachedProjectsPage({
      page,
      from: (page - 1) * PROJECT_PAGE_SIZE,
      size: PROJECT_PAGE_SIZE,
      sortColumn: s.column,
      sortAscending: s.ascending,
      q: searchParams.q,
      category: searchParams.category,
      min,
      max,
      flag,
    }),
    getCachedCategories(),
  ]);
  const projects = rows as ProjectCardData[];

  const pages = totalPages(count, PROJECT_PAGE_SIZE);
  const filterState = {
    q: searchParams.q,
    category: searchParams.category,
    min: searchParams.min,
    max: searchParams.max,
    sort: searchParams.sort,
    flag,
  };
  const activeCount = [searchParams.category, searchParams.min, searchParams.max, flag, searchParams.sort && searchParams.sort !== "newest" ? "1" : ""].filter(Boolean).length;
  const carried = cleanParams({ ...filterState, page: undefined });

  // Active-filter summary chips — each removes one filter, keeping the rest.
  const chipParams = cleanParams({ ...filterState });
  const without = (drop: string | string[]) => {
    const keys = Array.isArray(drop) ? drop : [drop];
    const next = { ...chipParams };
    keys.forEach((k) => delete next[k]);
    const qs = new URLSearchParams(next).toString();
    return qs ? `/projects?${qs}` : "/projects";
  };
  const catName = searchParams.category
    ? categories.find((c) => c.id === searchParams.category)?.name
    : undefined;
  const priceLabel =
    min !== undefined && max !== undefined
      ? `₹${min}–₹${max}`
      : min !== undefined
        ? `From ₹${min}`
        : max !== undefined
          ? `Up to ₹${max}`
          : undefined;
  const sortLabel =
    searchParams.sort && searchParams.sort !== "newest" ? PROJECT_SORTS[sort]?.label : undefined;
  const flagLabel = flag === "premium" ? "Premium" : flag === "bestseller" ? "Best sellers" : undefined;
  const chips = [
    catName ? { label: catName, href: without("category") } : null,
    priceLabel ? { label: priceLabel, href: without(["min", "max"]) } : null,
    flagLabel ? { label: flagLabel, href: without("flag") } : null,
    sortLabel ? { label: `Sorted: ${sortLabel}`, href: without("sort") } : null,
  ].filter((c): c is { label: string; href: string } => c !== null);
  const clearAllHref = searchParams.q ? `/projects?q=${encodeURIComponent(searchParams.q)}` : "/projects";

  return (
    <div className="page-shell">
      <PageHeader eyebrow="Marketplace" title="Project Marketplace" />

      <div className="mt-8">
        <CustomProjectBanner />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr] lg:items-start">
        <FilterSheet title="Filters" activeCount={activeCount}>
          <ProjectFilters categories={categories} state={filterState} />
        </FilterSheet>

        <div>
          <h2 className="sr-only">Projects</h2>
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
                >
                  {c.label}
                  <X className="h-3 w-3" aria-hidden />
                </Link>
              ))}
              <Link href={clearAllHref} className="text-xs font-semibold text-primary hover:underline">
                Clear all
              </Link>
            </div>
          )}
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-3 text-sm">
            <span className="font-semibold text-ink">
              {count ?? 0} project{(count ?? 0) === 1 ? "" : "s"}
            </span>
            {page > 1 ? (
              <span className="text-ink-faint">
                Page {page} of {pages}
              </span>
            ) : null}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects match these filters"
              subtitle="Try widening the price range, clearing a filter, or a different search term."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={pages} basePath="/projects" params={carried} />
        </div>
      </div>
    </div>
  );
}
