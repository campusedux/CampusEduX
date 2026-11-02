import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LayoutGrid, X } from "lucide-react";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { CustomProjectBanner } from "@/components/CustomProjectBanner";
import { FilterSheet, Pagination, EmptyState, SearchBar, SkeletonCard, Chip, ChipRow } from "@/components/ui";
import { ProjectFilters } from "@/components/marketplace/ProjectFilters";
import styles from "@/components/marketplace/projects.module.css";
import { getCachedProjectsPage, getCachedCategories } from "@/lib/cache";
import {
  absoluteUrl,
  listingCanonical,
  breadcrumbJsonLd,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";
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
  "Explore educational software project examples and source code on CampusEduX. Study, run and adapt them under the applicable license; do not submit purchased work as your own.";

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

export async function generateMetadata({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
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
  const page = parsePage(searchParams.page);
  const filtered = Boolean(
    searchParams.q ||
      searchParams.category ||
      searchParams.min ||
      searchParams.max ||
      searchParams.flag ||
      projectSort(searchParams.sort) !== "newest",
  );
  const url = listingCanonical("/projects", page, filtered);
  return {
    title: "Project Marketplace",
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: "Project Marketplace | CampusEduX",
      description: DESCRIPTION,
      url,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    // No results for this view (e.g. the catalog is empty, or the filters
    // matched nothing) -> don't index an empty shell page.
    robots:
      count === 0 || (page - 1) * PROJECT_PAGE_SIZE >= (count ?? Infinity)
        ? { index: false, follow: true }
        : undefined,
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
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
          className="border-solid bg-card px-4 py-10 sm:py-14"
          icon={LayoutGrid}
          title={query.filtered ? "No projects match these filters" : "No projects listed right now"}
          subtitle={
            query.filtered
              ? "Try widening the price range, clearing a filter, or a different search term."
              : "Explore custom projects or contact us to discuss your idea."
          }
          action={
            query.filtered ? (
              <Link href="/projects" className="btn-secondary min-h-11 text-sm">
                Clear filters
              </Link>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/custom-projects" className="btn-secondary min-h-11 text-sm">
                  Custom Projects
                </Link>
                <Link href="/contact" className="btn-secondary min-h-11 text-sm">
                  Contact
                </Link>
              </div>
            )
          }
        />
      ) : (
        <div className="list-enter grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
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
    <div role="status" aria-label="Loading projects">
      <span className="sr-only">Loading projects…</span>
      <div aria-hidden className="mb-4 h-5 w-28 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
      <div aria-hidden className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} variant="project" />
        ))}
      </div>
    </div>
  );
}

export default async function ProjectsPage({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }) {
  const searchParams = await searchParamsPromise;
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
    <div className="mobile-discovery min-w-0">
      <JsonLd data={breadcrumbJsonLd([{ name: "Projects", path: "/projects" }])} />
      <CustomProjectBanner />
      <section aria-label="Project marketplace" className={`container-page py-6 sm:py-8 lg:py-10 ${styles.marketplace}`}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-x-7 lg:gap-y-5">
          <SearchBar
            action="/projects"
            label="Search projects"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search projects, e.g. e-commerce, ML, Android…"
            hiddenParams={cleanParams({ category: filterState.category, min: filterState.min, max: filterState.max, sort: filterState.sort, flag })}
            className={`col-start-1 row-start-1 lg:col-start-2 ${styles.search}`}
          />
          <div className="col-start-2 row-start-1 min-w-0 lg:col-start-1 lg:row-span-3 lg:sticky lg:top-24">
            <FilterSheet title="Filters" activeCount={activeCount} iconOnly>
              <ProjectFilters categories={categories} state={filterState} />
            </FilterSheet>
          </div>
          {categories.length > 1 && (
            <ChipRow label="Categories" sticky className={`col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 ${styles.categories}`}>
              {[{ id: undefined as string | undefined, name: "All" }, ...categories].map((c) => (
                <Chip key={c.id ?? "all"} href={hrefWith({ category: c.id })} active={(searchParams.category ?? undefined) === c.id}>{c.name}</Chip>
              ))}
            </ChipRow>
          )}
          <div id="project-results" tabIndex={-1} className="col-span-2 row-start-3 min-w-0 scroll-mt-24 lg:col-span-1 lg:col-start-2">
            <h2 className="sr-only">Projects</h2>
            {chips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    aria-label={`Remove ${c.label} filter`}
                    className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-line bg-card px-3 py-2 text-xs font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
                  >
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">{c.label}</span>
                    <X className="h-3 w-3 shrink-0" aria-hidden />
                  </Link>
                ))}
                <Link href={clearAllHref} className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-primary hover:underline">
                  Clear all
                </Link>
              </div>
            )}
            <Suspense key={JSON.stringify(searchParams)} fallback={<ProjectResultsSkeleton />}>
              <ProjectResults query={query} />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
