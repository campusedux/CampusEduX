import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getLearningTree, getLearningGridBrief, firstTopicOf } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { DocsShell } from "../_components/DocsShell";
import { CourseHeader } from "../_components/CourseHeader";
import { TopicSection } from "../_components/TopicSection";

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

        <CourseHeader grid={grid} sectionCount={sections.length} topicCount={topicTotal} start={start} />

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <TopicSection key={section.id} section={section} gridSlug={grid.slug} />
          ))}
        </div>
      </DocsShell>
    </>
  );
}
