import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import JobCard, { JobCardData } from "@/components/JobCard";
import { SearchBar, FilterSheet, Pagination, EmptyState } from "@/components/ui";
import { JobFilters } from "@/components/marketplace/JobFilters";
import { JOB_LIST_FIELDS, JOB_PAGE_SIZE, JOB_SORTS, cleanParams, jobSort, parsePage, totalPages } from "@/lib/marketplace";

export const metadata: Metadata = { title: "Jobs & Internships" };
export const revalidate = 120;

type SP = { q?: string; location?: string; type?: string; sort?: string; page?: string };

export default async function JobsPage({ searchParams }: { searchParams: SP }) {
  const supabase = getPublicSupabase();
  const page = parsePage(searchParams.page);
  const sort = jobSort(searchParams.sort);

  let jobs: JobCardData[] = [];
  let count: number | null = 0;

  if (supabase) {
    const from = (page - 1) * JOB_PAGE_SIZE;
    const s = JOB_SORTS[sort];

    let query = supabase
      .from("jobs")
      .select(JOB_LIST_FIELDS, { count: "exact" })
      .order(s.column, { ascending: s.ascending, nullsFirst: false })
      .range(from, from + JOB_PAGE_SIZE - 1);

    if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
    if (searchParams.location) query = query.ilike("location", `%${searchParams.location}%`);
    if (searchParams.type) query = query.eq("job_type", searchParams.type);

    const { data, count: c } = await query;
    jobs = (data ?? []) as JobCardData[];
    count = c;
  }

  const pages = totalPages(count, JOB_PAGE_SIZE);
  const filterState = { q: searchParams.q, location: searchParams.location, type: searchParams.type, sort: searchParams.sort };
  const activeCount = [searchParams.location, searchParams.type, searchParams.sort && searchParams.sort !== "newest" ? "1" : ""].filter(Boolean).length;
  const carried = cleanParams({ ...filterState, page: undefined });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Jobs &amp; Internships</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Roles posted for CampusEduX students — filter by location and type, and apply from the web or the app with the
        same account.
      </p>

      <div className="mt-6 max-w-xl">
        <SearchBar action="/jobs" defaultValue={searchParams.q} placeholder="Job title…" hiddenParams={carried} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSheet title="Filters" activeCount={activeCount}>
          <JobFilters state={filterState} />
        </FilterSheet>

        <div>
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
