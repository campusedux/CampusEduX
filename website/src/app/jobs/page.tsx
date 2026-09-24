import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, Building2, Search, X } from "lucide-react";
import JobCard, { JobCardData } from "@/components/JobCard";
import { FilterSheet, Pagination, EmptyState, SkeletonJobCard } from "@/components/ui";
import { JobFilters } from "@/components/marketplace/JobFilters";
import { getCachedJobsPage } from "@/lib/cache";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { JOB_PAGE_SIZE, JOB_SORTS, cleanParams, jobExperience, jobSort, parsePage, totalPages } from "@/lib/marketplace";
import { cn } from "@/lib/cn";

const DESCRIPTION =
  "Browse jobs and internships on CampusEduX — filter by location, role type and freshness to find and apply to openings that match your career goals.";

export const revalidate = 120;

type SP = { q?: string; location?: string; type?: string; exp?: string; sort?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
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
  return {
    title: "Jobs & Internships",
    description: DESCRIPTION,
    alternates: { canonical: absoluteUrl("/jobs") },
    openGraph: {
      title: "Jobs & Internships | CampusEduX",
      description: DESCRIPTION,
      url: absoluteUrl("/jobs"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    // No results for this view -> don't index an empty shell page.
    robots: (count ?? 0) === 0 ? { index: false, follow: true } : undefined,
  };
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
      <div className="mb-5 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">
          {count ?? 0} open role{(count ?? 0) === 1 ? "" : "s"}
        </span>
        {page > 1 ? (
          <span className="text-ink-faint">
            Page {page} of {pages}
          </span>
        ) : null}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={filtered ? "No roles match these filters" : "No open roles right now"}
          subtitle={
            filtered
              ? "Try a broader location, a different job type, or clear the filters."
              : "New jobs and internships are added regularly — check back soon."
          }
          action={
            filtered ? (
              <Link href="/jobs" className="btn-secondary h-10 text-sm">
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    <div aria-hidden>
      <div className="mb-5 h-5 w-28 animate-pulse rounded bg-line/70" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonJobCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default async function JobsPage({ searchParams }: { searchParams: SP }) {
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
    <div className="page-shell">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-card px-5 py-8 shadow-card sm:px-10 sm:py-10">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,#000_15%,transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent-sky/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl flex-1">
            <p className="eyebrow">Careers</p>
            <h1 className="h-hero mt-2">Jobs &amp; Internships</h1>
            <form action="/jobs" method="get" role="search" className="mt-6 flex gap-2">
              {Object.entries(cleanParams({ location: filterState.location, type: filterState.type, exp: filterState.exp, sort: filterState.sort })).map(
                ([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ),
              )}
              <label className="relative flex-1">
                <span className="sr-only">Search roles</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchParams.q ?? ""}
                  placeholder="Search roles, e.g. Java developer, analyst…"
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-primary focus:bg-card"
                />
              </label>
              <button type="submit" className="btn-primary h-12 px-5">
                Search
              </button>
            </form>
          </div>
          <Link
            href="/jobs/companies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-700"
          >
            <Building2 className="h-4 w-4" aria-hidden /> Browse companies
          </Link>
        </div>

        {/* Quick experience switch — the most common filter for students. */}
        <nav aria-label="Experience level" className="relative mt-6 flex w-fit gap-1 rounded-xl bg-surface p-1">
          {([undefined, "fresher", "experienced"] as const).map((e) => {
            const active = (experience?.toLowerCase() ?? undefined) === e;
            return (
              <Link
                key={e ?? "all"}
                href={hrefWith({ exp: e, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "h-9 rounded-lg px-4 text-sm font-semibold leading-9 transition",
                  active ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink",
                )}
              >
                {e === undefined ? "All roles" : e === "fresher" ? "Fresher" : "Experienced"}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <FilterSheet title="Filters" activeCount={activeCount}>
            <JobFilters state={filterState} />
          </FilterSheet>
        </div>

        <div className="min-w-0">
          <h2 className="sr-only">Jobs</h2>
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
          <Suspense key={JSON.stringify(searchParams)} fallback={<JobResultsSkeleton />}>
            <JobResults searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
