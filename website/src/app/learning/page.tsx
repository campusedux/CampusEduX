import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, LayoutGrid } from "lucide-react";
import { getLearningGrids, searchLearning, GRID_TYPE_LABEL } from "@/lib/learning";
import { SearchBar, EmptyState, Badge } from "@/components/ui";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Learning",
  description:
    "Free, structured learning resources on CampusEduX — tutorials and documentation across programming, DSA, web development, databases and more.",
  alternates: { canonical: absoluteUrl("/learning") },
  openGraph: { title: "Learning · CampusEduX", url: absoluteUrl("/learning"), type: "website" },
};

type SP = { q?: string };

export default async function LearningIndexPage({ searchParams }: { searchParams: SP }) {
  const q = searchParams.q?.trim();
  const [grids, hits] = await Promise.all([getLearningGrids(), q ? searchLearning(q, 30) : Promise.resolve([])]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink">Learning</h1>
        <p className="mt-2 text-ink-muted">
          Structured, documentation-style learning resources — published by the CampusEduX team and kept up to date.
          Pick a resource to start reading.
        </p>
      </div>

      <div className="mt-6 max-w-xl">
        <SearchBar action="/learning" defaultValue={q} placeholder="Search topics and resources…" />
      </div>

      {q ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            {hits.length} result{hits.length === 1 ? "" : "s"} for “{q}”
          </h2>
          {hits.length === 0 ? (
            <EmptyState className="mt-4" title="No matches" subtitle="Try a different word, or browse the resources below." />
          ) : (
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {hits.map((h, i) => (
                <li key={`${h.grid_slug}-${h.topic_slug ?? "grid"}-${i}`}>
                  <Link
                    href={h.kind === "grid" ? `/learning/${h.grid_slug}` : `/learning/${h.grid_slug}/${h.topic_slug}`}
                    className="flex items-start gap-3 p-4 hover:bg-surface"
                  >
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                      {h.kind === "grid" ? (
                        <LayoutGrid className="h-4 w-4 text-primary" aria-hidden />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{h.title}</span>
                        {h.is_premium ? <Badge tone="premium">Premium</Badge> : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        {h.grid_name}
                        {h.section_name ? ` · ${h.section_name}` : ""}
                      </span>
                      {h.snippet ? (
                        <span className="mt-1 block line-clamp-2 text-sm text-ink-muted">{h.snippet}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="mt-10">
        {!q ? <h2 className="sr-only">All learning resources</h2> : <h2 className="mt-2 text-lg font-bold text-ink">All resources</h2>}
        {grids.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={BookOpen}
            title="No learning resources yet"
            subtitle="Learning resources appear here as soon as they are published from the CampusEduX admin panel."
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grids.map((g) => (
              <Link
                key={g.id}
                href={`/learning/${g.slug}`}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-primary"
                    style={{ backgroundColor: g.accent_color ? `${g.accent_color}1a` : "#EEF0FF" }}
                  >
                    {g.icon && isEmoji(g.icon) ? g.icon : g.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 font-semibold text-ink group-hover:text-primary">
                      <span className="truncate">{g.name}</span>
                      {g.is_premium ? <Badge tone="premium">Premium</Badge> : null}
                    </h3>
                    <p className="text-xs text-ink-faint">
                      {GRID_TYPE_LABEL[g.grid_type] ?? "Resource"} · {g.topic_count} topic
                      {g.topic_count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                {g.description ? (
                  <p className="mt-3 line-clamp-3 flex-1 text-sm text-ink-muted">{g.description}</p>
                ) : (
                  <span className="flex-1" />
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  View resource <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function isEmoji(s: string): boolean {
  return /\p{Extended_Pictographic}/u.test(s);
}
