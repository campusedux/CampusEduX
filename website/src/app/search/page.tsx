import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { runGlobalSearch, RESULTS_LIMIT } from "@/lib/search";
import { sanitizeSearchTerm, isSearchableTerm } from "@/lib/searchModel";
import { GlobalSearchField } from "@/components/search/GlobalSearch";
import { GROUP_ICON } from "@/components/search/groupMeta";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

// Reads `searchParams` → always rendered per request. Never indexed (see
// `generateMetadata`) so query-string permutations don't enter the crawl.
export const dynamic = "force-dynamic";

type SP = { q?: string };

export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const term = sanitizeSearchTerm(searchParams.q);
  return {
    title: term ? `Search: ${term}` : "Search",
    description: "Search projects, learning resources, tutorials, jobs and blog posts across CampusEduX.",
    robots: { index: false, follow: true },
  };
}

const BROWSE = [
  { label: "Projects", href: "/projects" },
  { label: "Jobs", href: "/jobs" },
  { label: "Learning", href: "/learning" },
  { label: "Blog", href: "/blog" },
];

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const term = sanitizeSearchTerm(searchParams.q);
  const hasQuery = isSearchableTerm(term);
  const { groups, total } = hasQuery
    ? await runGlobalSearch(term, RESULTS_LIMIT)
    : { groups: [], total: 0 };

  return (
    <div className="container-page py-10">
      <PageHeader
        title="Search"
        description="One search across projects, learning, jobs and the blog."
      />

      <GlobalSearchField
        key={term}
        variant="page"
        defaultValue={term}
        autoFocus={!hasQuery}
        className="mt-6 max-w-2xl"
      />

      {!hasQuery ? (
        <div className="mt-10">
          <p className="text-sm text-ink-muted">
            Type at least two characters to search. Or jump straight to a section:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BROWSE.map((b) => (
              <Link
                key={b.href}
                href={b.href}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={SearchX}
          title={`No results found for “${term}”`}
          subtitle="Try another keyword or browse Projects, Jobs, Learning and Blog."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {BROWSE.map((b) => (
                <Link
                  key={b.href}
                  href={b.href}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
                >
                  {b.label}
                </Link>
              ))}
            </div>
          }
        />
      ) : (
        <>
          <p className="mt-8 text-sm text-ink-muted">
            {total} result{total === 1 ? "" : "s"} for “<span className="font-semibold text-ink">{term}</span>”
          </p>

          <div className="mt-2 space-y-8">
            {groups.map((group) => {
              const Icon = GROUP_ICON[group.type];
              return (
                <section key={group.type}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                      {group.label}
                      <span className="text-sm font-normal text-ink-faint">{group.total}</span>
                    </h2>
                    {group.allHref && (
                      <Link
                        href={group.allHref}
                        className="whitespace-nowrap text-sm font-semibold text-primary hover:underline"
                      >
                        View all →
                      </Link>
                    )}
                  </div>

                  <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="flex items-start gap-3 p-4 transition hover:bg-surface">
                          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                            <Icon className="h-4 w-4 text-primary" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-ink">{item.title}</span>
                              {item.isPremium && <Badge tone="premium">Premium</Badge>}
                            </span>
                            {item.subtitle && (
                              <span className="mt-0.5 block truncate text-sm text-ink-muted">{item.subtitle}</span>
                            )}
                          </span>
                          <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
