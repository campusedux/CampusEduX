import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { completeSeoMetadata, hasQueryVariants } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, Building2, X } from "lucide-react";
import JobCard, { JobCardData } from "@/components/JobCard";
import { FilterSheet, Pagination, PageHeader, SearchBar, SkeletonJobCard, Chip, ChipRow, EmptyState } from "@/components/ui";
import { JobFilters } from "@/components/marketplace/JobFilters";
import { getCachedJobsPage } from "@/lib/cache";
import { absoluteUrl, listingCanonical, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { JOB_PAGE_SIZE, JOB_SORTS, cleanParams, jobExperience, jobSort, parsePage, totalPages } from "@/lib/marketplace";

const DESCRIPTION =
  "Browse jobs and internships on CampusEduX — filter by location, role type and freshness to find and apply to openings that match your career goals.";

export const revalidate = 0;

type SP = { q?: string; location?: string; type?: string; exp?: string; sort?: string; page?: string };

export async function generateMetadata({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const s = JOB_SORTS[jobSort(searchParams.sort)];
  const { count } = await getCachedJobsPage({
    from: 0,
    size: 1,
    sortColumn: s.column,
    sortAscending: s.ascending,
    q: searchParams.q,
    location: searchParams.location,
    type: searchParams.type,
    experience: jobExperience(searchParams.exp),
  });
  const page = parsePage(searchParams.page);
  const filtered = Boolean(
    searchParams.q ||
      searchParams.location ||
      searchParams.type ||
      jobExperience(searchParams.exp) ||
      jobSort(searchParams.sort) !== "newest",
  );
  const url = listingCanonical("/jobs", page, filtered);
  return completeSeoMetadata({
    title: "Jobs & Internships",
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: "Jobs & Internships | CampusEduX",
      description: DESCRIPTION,
      url,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    // No results for this view -> don't index an empty shell page.
    robots:
      hasQueryVariants(searchParams) || count === 0 || (page - 1) * JOB_PAGE_SIZE >= (count ?? Infinity)
        ? { index: false, follow: true }
        : undefined,
  });
}

/** The result list — its own async boundary so the page shell + filters paint first. */
async function JobResults({ searchParams }: { searchParams: SP }) {
  const page = parsePage(searchParams.page);
  const sort = jobSort(searchParams.sort);
  const s = JOB_SORTS[sort];
  const experience = jobExperience(searchParams.exp);

  // Per-filter cross-request cache (lib/cache.ts) — dynamic route, cached data.
  const { jobs: rows, count } = await getCachedJobsPage({
    from: (page - 1) * JOB_PAGE_SIZE,
    size: JOB_PAGE_SIZE,
    sortColumn: s.column,
    sortAscending: s.ascending,
    q: searchParams.q,
    location: searchParams.location,
    type: searchParams.type,
    experience,
  });
  const jobs = rows as JobCardData[];
  const pages = totalPages(count, JOB_PAGE_SIZE);
  const carried = cleanParams({
    q: searchParams.q,
    location: searchParams.location,
    type: searchParams.type,
    exp: searchParams.exp,
    sort: searchParams.sort,
  });
  const filtered = Boolean(searchParams.q || searchParams.location || searchParams.type || experience);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-ink-muted">
          {count ?? 0} open role{(count ?? 0) === 1 ? "" : "s"}
        </span>
        {filtered && jobs.length === 0 && (
          <Link href="/jobs" className="inline-flex min-h-11 items-center text-xs font-semibold text-primary">Clear filters</Link>
        )}
        {page > 1 ? (
          <span className="text-ink-faint">
            Page {page} of {pages}
          </span>
        ) : null}
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title={filtered ? "No roles match these filters" : "No open roles right now"} action={<>
          <Link href="/jobs/companies" className="btn-ghost min-h-11 px-3 text-xs">Browse companies</Link>
          <Link href="/learning" className="btn-ghost min-h-11 px-3 text-xs">Explore Learning</Link>
        </>} />
      ) : (
        <div className="list-enter grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={pages} basePath="/jobs" params={carried} />
    </>
  );
}

function JobResultsSkeleton() {
  return (
    <div role="status" aria-label="Loading jobs">
      <span className="sr-only">Loading jobs…</span>
      <div aria-hidden className="mb-4 h-5 w-28 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
      <div aria-hidden className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonJobCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default async function JobsPage({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }) {
  const searchParams = await searchParamsPromise;
  const sort = jobSort(searchParams.sort);
  const experience = jobExperience(searchParams.exp);
  const filterState = {
    q: searchParams.q,
    location: searchParams.location,
    type: searchParams.type,
    exp: experience?.toLowerCase(),
    sort: searchParams.sort,
  };
  const activeCount = [searchParams.location, searchParams.type, experience, searchParams.sort && searchParams.sort !== "newest" ? "1" : ""].filter(Boolean).length;

  // Active-filter summary chips — each removes one filter, keeping the rest.
  const chipParams = cleanParams({ ...filterState });
  const hrefWith = (next: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(cleanParams({ ...chipParams, ...next })).toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  };
  const without = (drop: string) => hrefWith({ [drop]: undefined });
  const sortLabel = searchParams.sort && searchParams.sort !== "newest" ? JOB_SORTS[sort]?.label : undefined;
  const chips = [
    searchParams.location ? { label: searchParams.location, href: without("location") } : null,
    searchParams.type ? { label: searchParams.type, href: without("type") } : null,
    sortLabel ? { label: `Sorted: ${sortLabel}`, href: without("sort") } : null,
  ].filter((c): c is { label: string; href: string } => c !== null);
  const clearAllHref = searchParams.q ? `/jobs?q=${encodeURIComponent(searchParams.q)}` : "/jobs";

  return (
    <div className="mobile-discovery page-shell max-sm:py-4">
      <JsonLd data={breadcrumbJsonLd([{ name: "Jobs", path: "/jobs" }])} />
      <Breadcrumb className="mb-4" items={[{ label: "Jobs" }]} />
      <PageHeader title="Jobs & Internships" caption="Find your next career opportunity." icon={Briefcase} iconClassName="text-accent-sky" action={
        <Link href="/jobs/companies" aria-label="Browse companies" title="Browse companies" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-line bg-card px-3 text-sm font-medium text-ink-muted hover:text-ink sm:border-0 sm:bg-transparent">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden /> <span className="sr-only sm:not-sr-only">Browse companies</span>
        </Link>
      } />

      <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_44px] gap-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <SearchBar
          action="/jobs"
          label="Search roles"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search roles, e.g. Java developer, analyst…"
          hiddenParams={cleanParams({ location: filterState.location, type: filterState.type, exp: filterState.exp, sort: filterState.sort })}
          className="col-start-1 row-start-1 lg:col-start-2"
        />
        <div className="col-start-2 row-start-1 min-w-0 lg:col-start-1 lg:row-span-3 lg:sticky lg:top-24">
          <FilterSheet title="Filters" activeCount={activeCount} iconOnly>
            <JobFilters state={filterState} />
          </FilterSheet>
        </div>
        <ChipRow label="Experience level" sticky className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2">
          {([undefined, "fresher", "experienced"] as const).map((e) => (
            <Chip key={e ?? "all"} href={hrefWith({ exp: e, page: undefined })} active={(experience?.toLowerCase() ?? undefined) === e}>
              {e === undefined ? "All" : e === "fresher" ? "Fresher" : "Experienced"}
            </Chip>
          ))}
        </ChipRow>
        <div className="col-span-2 row-start-3 min-w-0 lg:col-span-1 lg:col-start-2">
          <h2 className="sr-only">Jobs</h2>
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
          <div className="min-h-[840px] md:min-h-[440px] xl:min-h-[320px]">
          <Suspense key={JSON.stringify(searchParams)} fallback={<JobResultsSkeleton />}>
            <JobResults searchParams={searchParams} />
          </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
