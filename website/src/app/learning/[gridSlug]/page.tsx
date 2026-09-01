import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Lock } from "lucide-react";
import { getLearningTree, getLearningGridBrief, firstTopicOf, isContentGrid } from "@/lib/learning";
import { Button } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { DocsShell } from "../_components/DocsShell";
import { TypedGridView } from "./TypedGridView";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { gridSlug: string } }): Promise<Metadata> {
  const grid = await getLearningGridBrief(params.gridSlug);
  if (!grid) return { title: "Learning resource not found", robots: { index: false, follow: false } };
  const description = (grid.description || `${grid.name} — a structured learning resource on CampusEduX.`).slice(0, 155);
  return {
    title: grid.name,
    description,
    alternates: { canonical: absoluteUrl(`/learning/${grid.slug}`) },
    openGraph: {
      title: grid.name,
      description,
      url: absoluteUrl(`/learning/${grid.slug}`),
      type: "website",
      ...(grid.cover_image_url ? { images: [{ url: grid.cover_image_url }] } : {}),
    },
  };
}

export default async function GridOverviewPage({ params }: { params: { gridSlug: string } }) {
  const brief = await getLearningGridBrief(params.gridSlug);
  if (!brief) notFound();

  // Specialised grids (dsa / mock_test / hr / company) render the canonical
  // practice catalog; content / custom / unknown grids render the topic tree.
  if (!isContentGrid(brief.grid_type)) {
    return (
      <>
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Learning", path: "/learning" },
            { name: brief.name, path: `/learning/${brief.slug}` },
          ])}
        />
        <TypedGridView grid={brief} />
      </>
    );
  }

  const tree = await getLearningTree(params.gridSlug);
  if (!tree) notFound();
  const { grid, sections } = tree;
  const start = firstTopicOf(tree);
  const topicTotal = sections.reduce((n, s) => n + s.topics.length, 0);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Learning", path: "/learning" },
          { name: grid.name, path: `/learning/${grid.slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: grid.name,
          description: grid.description || undefined,
          url: absoluteUrl(`/learning/${grid.slug}`),
          provider: { "@type": "Organization", name: "CampusEduX" },
          hasPart: sections
            .flatMap((s) => s.topics)
            .slice(0, 25)
            .map((t) => ({
              "@type": "LearningResource",
              name: t.title,
              url: absoluteUrl(`/learning/${grid.slug}/${t.slug}`),
            })),
        }}
      />
      <DocsShell tree={tree} gridSlug={grid.slug}>
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-ink-faint">
          <Link href="/learning" className="hover:text-ink">
            Learning
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-ink-muted">{grid.name}</span>
        </nav>

        {grid.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied Storage URL
          <img
            src={grid.cover_image_url}
            alt=""
            className="mb-6 aspect-[3/1] w-full rounded-2xl border border-line object-cover"
          />
        ) : null}

        <h1 className="text-3xl font-bold text-ink">{grid.name}</h1>
        {grid.description ? <p className="mt-3 max-w-2xl text-ink-muted">{grid.description}</p> : null}

        {start ? (
          <Button
            href={`/learning/${grid.slug}/${start.topic.slug}`}
            rightIcon={ArrowRight}
            className="mt-5"
          >
            Start reading: {start.topic.title}
          </Button>
        ) : null}

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-faint">
          {sections.length} section{sections.length === 1 ? "" : "s"} · {topicTotal} topic{topicTotal === 1 ? "" : "s"}
        </p>

        <div className="mt-4 space-y-6">
          {sections.map((section) => (
            <section key={section.id} className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">{section.name}</h2>
              {section.description ? <p className="mt-1 text-sm text-ink-muted">{section.description}</p> : null}
              {section.topics.length === 0 ? (
                <p className="mt-3 text-sm text-ink-faint">No topics published yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {section.topics.map((topic) => (
                    <li key={topic.id}>
                      <Link
                        href={`/learning/${grid.slug}/${topic.slug}`}
                        className="group flex items-center gap-2 py-2.5 text-sm"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-ink group-hover:text-primary">{topic.title}</span>
                          {topic.short_description ? (
                            <span className="block truncate text-xs text-ink-faint">{topic.short_description}</span>
                          ) : null}
                        </span>
                        {topic.is_premium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            <Lock className="h-3 w-3" aria-hidden /> Premium
                          </span>
                        ) : null}
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </DocsShell>
    </>
  );
}
