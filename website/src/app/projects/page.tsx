import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LayoutGrid, Search, X } from "lucide-react";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { FilterSheet, Pagination, EmptyState, SkeletonProjectCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ProjectFilters } from "@/components/marketplace/ProjectFilters";
import { getCachedProjectsPage, getCachedCategories } from "@/lib/cache";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
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

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { count } = await getCachedProjectsPage({
    page: 1,
    from: 0,
    size: 1,
    sortColumn: PROJECT_SORTS[projectSort(searchParams.sort)].column,
    sortAscending: PROJECT_SORTS[projectSort(searchParams.sort)].ascending,
    q: searchParams.q,
    category: searchParams.category,
    min: parsePrice(searchParams.min),
    max: parsePrice(searchParams.max),
    flag: searchParams.flag === "premium" || searchParams.flag === "bestseller" ? searchParams.flag : undefined,
  });
  return {
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
    // No results for this view (e.g. the catalog is empty, or the filters
    // matched nothing) -> don't index an empty shell page.
    robots: count === 0 ? { index: false, follow: true } : undefined,
  };
}

type ProjectQuery = {
  page: number;
  sort: ReturnType<typeof projectSort>;
  min?: number;
  max?: number;
  flag?: "premium" | "bestseller";
  q?: string;
  category?: string;
  carried: Record<string, string>;
  filtered: boolean;
};

/** Result grid — its own async boundary so the shell + filters paint first. */
async function ProjectResults({ query }: { query: ProjectQuery }) {
  const s = PROJECT_SORTS[query.sort];
  // Data is served from a per-filter cross-request cache (lib/cache.ts) — this
  // route stays dynamic to read the URL, but no longer hits Supabase per visit.
  const { projects: rows, count } = await getCachedProjectsPage({
    page: query.page,
    from: (query.page - 1) * PROJECT_PAGE_SIZE,
    size: PROJECT_PAGE_SIZE,
    sortColumn: s.column,
    sortAscending: s.ascending,
    q: query.q,
    category: query.category,
    min: query.min,
    max: query.max,
    flag: query.flag,
  });
  const projects = rows as ProjectCardData[];
  const pages = totalPages(count, PROJECT_PAGE_SIZE);

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">
          {count ?? 0} project{(count ?? 0) === 1 ? "" : "s"}
        </span>
        {query.page > 1 ? (
          <span className="text-ink-faint">
            Page {query.page} of {pages}
          </span>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={query.filtered ? "No projects match these filters" : "No projects listed yet"}
          subtitle={
            query.filtered
              ? "Try widening the price range, clearing a filter, or a different search term."
              : "Projects appear here as soon as they are published."
          }
          action={
            query.filtered ? (
              <Link href="/projects" className="btn-secondary h-10 text-sm">
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <Pagination page={query.page} totalPages={pages} basePath="/projects" params={query.carried} />
    </>
  );
}

function ProjectResultsSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-5 h-5 w-28 animate-pulse rounded bg-line/70" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonProjectCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: SP }) {
  const page = parsePage(searchParams.page);
  const sort = projectSort(searchParams.sort);
  const min = parsePrice(searchParams.min);
  const max = parsePrice(searchParams.max);
  const flag = searchParams.flag === "premium" || searchParams.flag === "bestseller" ? searchParams.flag : undefined;
  const categories = await getCachedCategories();

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
  const hrefWith = (next: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(cleanParams({ ...chipParams, page: undefined, ...next })).toString();
    return qs ? `/projects?${qs}` : "/projects";
  };
  const without = (drop: string | string[]) => {
    const keys = Array.isArray(drop) ? drop : [drop];
    return hrefWith(Object.fromEntries(keys.map((k) => [k, undefined])));
  };
  const catName = searchParams.category ? categories.find((c) => c.id === searchParams.category)?.name : undefined;
  const priceLabel =
    min !== undefined && max !== undefined
      ? `₹${min}–₹${max}`
      : min !== undefined
        ? `From ₹${min}`
        : max !== undefined
          ? `Up to ₹${max}`
          : undefined;
  const sortLabel = searchParams.sort && searchParams.sort !== "newest" ? PROJECT_SORTS[sort]?.label : undefined;
  const flagLabel = flag === "premium" ? "Premium" : flag === "bestseller" ? "Best sellers" : undefined;
  const chips = [
    catName ? { label: catName, href: without("category") } : null,
    priceLabel ? { label: priceLabel, href: without(["min", "max"]) } : null,
    flagLabel ? { label: flagLabel, href: without("flag") } : null,
    sortLabel ? { label: `Sorted: ${sortLabel}`, href: without("sort") } : null,
  ].filter((c): c is { label: string; href: string } => c !== null);
  const clearAllHref = searchParams.q ? `/projects?q=${encodeURIComponent(searchParams.q)}` : "/projects";
  const query: ProjectQuery = {
    page,
    sort,
    min,
    max,
    flag,
    q: searchParams.q,
    category: searchParams.category,
    carried,
    filtered: Boolean(searchParams.q || searchParams.category || min !== undefined || max !== undefined || flag),
  };

  return (
    <div className="page-shell">
      <JsonLd data={breadcrumbJsonLd([{ name: "Projects", path: "/projects" }])} />
      <header className="relative overflow-hidden rounded-3xl border border-line bg-card px-5 py-8 shadow-card sm:px-10 sm:py-10">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,#000_15%,transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Marketplace</p>
          <h1 className="h-hero mt-2">Project Marketplace</h1>
          <form action="/projects" method="get" role="search" className="mt-6 flex gap-2">
            {Object.entries(cleanParams({ category: filterState.category, min: filterState.min, max: filterState.max, sort: filterState.sort, flag })).map(
              ([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ),
            )}
            <label className="relative flex-1">
              <span className="sr-only">Search projects</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="Search projects, e.g. e-commerce, ML, Android…"
                className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-4 focus:ring-primary/15 focus:bg-card"
              />
            </label>
            <button type="submit" className="btn-primary h-12 px-5">
              Search
            </button>
          </form>
        </div>
        {categories.length > 1 && (
          <nav aria-label="Categories" className="relative -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-10 sm:px-10 [&::-webkit-scrollbar]:hidden">
            {[{ id: undefined as string | undefined, name: "All" }, ...categories].map((c) => {
              const active = (searchParams.category ?? undefined) === c.id;
              return (
                <Link
                  key={c.id ?? "all"}
                  href={hrefWith({ category: c.id })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition max-sm:py-2.5",
                    active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-muted hover:border-primary/40 hover:text-ink",
                  )}
                >
                  {c.name}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <div className="mt-8">
        <CustomProjectBanner />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <FilterSheet title="Filters" activeCount={activeCount}>
            <ProjectFilters categories={categories} state={filterState} />
          </FilterSheet>
        </div>

        <div className="min-w-0">
          <h2 className="sr-only">Projects</h2>
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
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
          <Suspense key={JSON.stringify(searchParams)} fallback={<ProjectResultsSkeleton />}>
            <ProjectResults query={query} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
