import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { FilterSheet, Pagination, PageHeader } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { listingCanonical, breadcrumbJsonLd } from "@/lib/seo";
import { getPracticeCategories, getPracticeProblemsPage } from "@/lib/practice";
import {
  PRACTICE_PAGE_SIZE,
  PRACTICE_LANGUAGE_LABEL,
  parsePracticeQuery,
  practiceParams,
  totalPages,
} from "@/lib/practice.types";
import { PracticeFilters } from "./PracticeFilters";
import { PracticeProblemGrid } from "./PracticeProblemGrid";

export const revalidate = 300;

export async function generateMetadata({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const query = parsePracticeQuery(searchParams);
  const { items } = await getPracticeProblemsPage(query);
  const filtered = Boolean(
    query.q || query.difficulty || query.category || query.lang || query.status,
  );
  return {
    title: "Coding Problems",
    description:
      "Practise programming problems on CampusEduX — each solvable in Java, Python, C, C++ and JavaScript. Filter by difficulty, topic, language and your progress.",
    alternates: {
      canonical: listingCanonical(
        "/practice/problems",
        query.page,
        filtered,
      ),
    },
    robots: items.length === 0 ? { index: false, follow: true } : undefined,
  };
}

type SP = Record<string, string | string[] | undefined>;

export default async function PracticeProblemsPage({ searchParams: searchParamsPromise }: { searchParams: Promise<SP> }) {
  const searchParams = await searchParamsPromise;
  const query = parsePracticeQuery(searchParams);
  const [{ total, items }, categories] = await Promise.all([
    getPracticeProblemsPage(query),
    getPracticeCategories(),
  ]);

  const pages = totalPages(total, PRACTICE_PAGE_SIZE);
  const carried = practiceParams({ ...query, page: undefined });

  const activeCount = [query.difficulty, query.category, query.lang, query.status].filter(Boolean).length;

  const without = (drop: (keyof typeof query)[]) => {
    const next = practiceParams({ ...query, page: undefined });
    drop.forEach((k) => delete next[k as string]);
    const qs = new URLSearchParams(next).toString();
    return qs ? `/practice/problems?${qs}` : "/practice/problems";
  };
  const catName = query.category ? categories.find((c) => c.slug === query.category)?.name : undefined;
  const chips = [
    query.difficulty ? { label: query.difficulty, href: without(["difficulty"]) } : null,
    catName ? { label: catName, href: without(["category"]) } : null,
    query.lang ? { label: PRACTICE_LANGUAGE_LABEL[query.lang] ?? query.lang, href: without(["lang"]) } : null,
    query.status ? { label: query.status === "solved" ? "Solved" : "Unsolved", href: without(["status"]) } : null,
  ].filter((c): c is { label: string; href: string } => c !== null);
  const clearAllHref = query.q ? `/practice/problems?q=${encodeURIComponent(query.q)}` : "/practice/problems";

  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Practice", path: "/practice" },
          { name: "Coding Problems", path: "/practice/problems" },
        ])}
      />
      <PageHeader eyebrow="Practice" title="Coding Problems" />

      <div className="mt-6 grid gap-4 md:gap-5 lg:grid-cols-[260px_1fr] lg:items-start">
        <FilterSheet title="Filters" activeCount={activeCount}>
          <PracticeFilters categories={categories} state={query} />
        </FilterSheet>

        <div>
          <h2 className="sr-only">Problems</h2>
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

          <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-3 text-sm">
            <span className="font-semibold text-ink">
              {total} problem{total === 1 ? "" : "s"}
            </span>
            {query.page > 1 ? (
              <span className="text-ink-faint">
                Page {query.page} of {pages}
              </span>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface px-6 py-12 text-center text-sm text-ink-muted">
              No problems match these filters. Try clearing one, or a different search term.
            </p>
          ) : (
            <PracticeProblemGrid items={items} statusFilter={query.status} />
          )}

          <Pagination page={query.page} totalPages={pages} basePath="/practice/problems" params={carried} />
        </div>
      </div>
    </div>
  );
}
