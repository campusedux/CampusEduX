import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, LayoutGrid } from "lucide-react";
import { getLearningGrids, searchLearning } from "@/lib/learning";
import type { LearningGridCard } from "@/lib/learning";
import { EmptyState, Badge, ResourceCard } from "@/components/ui";
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

function isEmoji(s: string): boolean {
  return /\p{Extended_Pictographic}/u.test(s);
}

function GridCard({ g }: { g: LearningGridCard }) {
  return (
    <ResourceCard
      resource={{
        href: `/learning/${g.slug}`,
        icon: g.icon && isEmoji(g.icon) ? g.icon : <BookOpen className="h-5 w-5" aria-hidden />,
        title: g.name,
        typeLabel: "Resource",
        topicCount: g.topic_count,
        description: g.description,
        accentColor: g.accent_color,
        isPremium: g.is_premium,
      }}
    />
  );
}

export default async function LearningIndexPage({ searchParams }: { searchParams: SP }) {
  const q = searchParams.q?.trim();
  const [grids, hits] = await Promise.all([getLearningGrids(), q ? searchLearning(q, 30) : Promise.resolve([])]);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Learning</h1>

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

      {grids.length === 0 ? (
        <section className="mt-8">
          <h2 className="sr-only">All learning resources</h2>
          <EmptyState
            className="mt-4"
            icon={BookOpen}
            title="No learning resources yet"
            subtitle="Learning resources appear here as soon as they are published from the CampusEduX admin panel."
          />
        </section>
      ) : (
        <section className="mt-8">
          {!q ? (
            <h2 className="sr-only">All learning resources</h2>
          ) : (
            <h2 className="mt-2 text-lg font-bold text-ink">All resources</h2>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grids.map((g) => (
              <GridCard key={g.id} g={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
