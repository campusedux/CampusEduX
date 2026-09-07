import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import JobCard, { JobCardData } from "@/components/JobCard";
import { FilterSheet, Pagination, EmptyState, PageHeader } from "@/components/ui";
import { JobFilters } from "@/components/marketplace/JobFilters";
import { getCachedJobsPage } from "@/lib/cache";
import { JOB_PAGE_SIZE, JOB_SORTS, cleanParams, jobSort, parsePage, totalPages } from "@/lib/marketplace";

export const metadata: Metadata = { title: "Jobs & Internships" };
export const revalidate = 120;

type SP = { q?: string; location?: string; type?: string; sort?: string; page?: string };

export default async function JobsPage({ searchParams }: { searchParams: SP }) {
  const page = parsePage(searchParams.page);
  const sort = jobSort(searchParams.sort);
  const s = JOB_SORTS[sort];

  // Per-filter cross-request cache (lib/cache.ts) — dynamic route, cached data.
  const { jobs: rows, count } = await getCachedJobsPage({
    from: (page - 1) * JOB_PAGE_SIZE,
    size: JOB_PAGE_SIZE,
    sortColumn: s.column,
    sortAscending: s.ascending,
    q: searchParams.q,
    location: searchParams.location,
    type: searchParams.type,
  });
  const jobs = rows as JobCardData[];

  const pages = totalPages(count, JOB_PAGE_SIZE);
  const filterState = { q: searchParams.q, location: searchParams.location, type: searchParams.type, sort: searchParams.sort };
  const activeCount = [searchParams.location, searchParams.type, searchParams.sort && searchParams.sort !== "newest" ? "1" : ""].filter(Boolean).length;
  const carried = cleanParams({ ...filterState, page: undefined });

  // Active-filter summary chips — each removes one filter, keeping the rest.
  const chipParams = cleanParams({ ...filterState });
  const without = (drop: string) => {
    const next = { ...chipParams };
    delete next[drop];
    const qs = new URLSearchParams(next).toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  };
  const sortLabel =
    searchParams.sort && searchParams.sort !== "newest" ? JOB_SORTS[sort]?.label : undefined;
  const chips = [
    searchParams.location ? { label: searchParams.location, href: without("location") } : null,
    searchParams.type ? { label: searchParams.type, href: without("type") } : null,
    sortLabel ? { label: `Sorted: ${sortLabel}`, href: without("sort") } : null,
  ].filter((c): c is { label: string; href: string } => c !== null);
  const clearAllHref = searchParams.q ? `/jobs?q=${encodeURIComponent(searchParams.q)}` : "/jobs";

  return (
    <div className="container-page py-10">
      <PageHeader title="Jobs & Internships" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSheet title="Filters" activeCount={activeCount}>
          <JobFilters state={filterState} />
        </FilterSheet>

        <div>
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
          <div className="mb-4 text-sm text-ink-muted">
            {count ?? 0} role{(count ?? 0) === 1 ? "" : "s"}
            {page > 1 ? ` · page ${page} of ${pages}` : ""}
          </div>

          {jobs.length === 0 ? (
            <EmptyState title="No roles match these filters" subtitle="Try broadening the location or clearing the job-type filter." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={pages} basePath="/jobs" params={carried} />
        </div>
      </div>
    </div>
  );
}
