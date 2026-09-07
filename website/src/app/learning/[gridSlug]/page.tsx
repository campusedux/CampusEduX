import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLearningTree, getLearningGridBrief, getLearningGridSlugs, firstTopicOf } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { Breadcrumb } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { DocsShell } from "../_components/DocsShell";
import { CourseHeader } from "../_components/CourseHeader";
import { TopicSection } from "../_components/TopicSection";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getLearningGridSlugs()).map((gridSlug) => ({ gridSlug }));
}

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
  const [brief, tree] = await Promise.all([
    getLearningGridBrief(params.gridSlug),
    getLearningTree(params.gridSlug),
  ]);
  if (!brief || !tree) notFound();
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
        <Breadcrumb className="mb-4" items={[{ label: "Learning", href: "/learning" }, { label: grid.name }]} />

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
