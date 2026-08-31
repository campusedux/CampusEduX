import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { SearchBar, FilterSheet, Pagination, EmptyState } from "@/components/ui";
import { ProjectFilters } from "@/components/marketplace/ProjectFilters";
import {
  PROJECT_LIST_FIELDS,
  PROJECT_PAGE_SIZE,
  PROJECT_SORTS,
  cleanParams,
  parsePage,
  parsePrice,
  projectSort,
  totalPages,
} from "@/lib/marketplace";

export const metadata: Metadata = { title: "Project Marketplace" };
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
  const supabase = getPublicSupabase();
  const page = parsePage(searchParams.page);
  const sort = projectSort(searchParams.sort);
  const min = parsePrice(searchParams.min);
  const max = parsePrice(searchParams.max);
  const flag = searchParams.flag === "premium" || searchParams.flag === "bestseller" ? searchParams.flag : undefined;

  let projects: ProjectCardData[] = [];
  let count: number | null = 0;
  let categories: { id: string; name: string }[] = [];

  if (supabase) {
    const from = (page - 1) * PROJECT_PAGE_SIZE;
    const s = PROJECT_SORTS[sort];

    let query = supabase
      .from("projects")
      .select(PROJECT_LIST_FIELDS, { count: "exact" })
      .order(s.column, { ascending: s.ascending })
      .range(from, from + PROJECT_PAGE_SIZE - 1);

    if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
    if (searchParams.category) query = query.eq("category_id", searchParams.category);
    if (min !== undefined) query = query.gte("price", min);
    if (max !== undefined) query = query.lte("price", max);
    if (flag === "premium") query = query.eq("is_premium", true);
    if (flag === "bestseller") query = query.eq("is_best_seller", true);

    const [{ data, count: c }, { data: cats }] = await Promise.all([
      query,
      supabase.from("categories").select("id,name").order("name"),
    ]);
    projects = (data ?? []) as ProjectCardData[];
    count = c;
    categories = cats ?? [];
  }

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Project Marketplace</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Academic, personal and business projects listed by the CampusEduX community — filter by category and price, or
        search by title.
      </p>

      <div className="mt-6 max-w-xl">
        <SearchBar action="/projects" defaultValue={searchParams.q} placeholder="Search projects…" hiddenParams={carried} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSheet title="Filters" activeCount={activeCount}>
          <ProjectFilters categories={categories} state={filterState} />
        </FilterSheet>

        <div>
          <div className="mb-4 text-sm text-ink-muted">
            {count ?? 0} project{(count ?? 0) === 1 ? "" : "s"}
            {page > 1 ? ` · page ${page} of ${pages}` : ""}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects match these filters"
              subtitle="Try widening the price range, clearing a filter, or a different search term."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
