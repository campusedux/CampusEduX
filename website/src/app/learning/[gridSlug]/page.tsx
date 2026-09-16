import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListChecks } from "lucide-react";
import { getLearningTree, getLearningGridBrief, getLearningGridSlugs, getGridScopedTests, firstTopicOf } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { Breadcrumb, Button } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd, courseJsonLd } from "@/lib/seo";
import { DocsShell } from "../_components/DocsShell";
import { CourseHeader } from "../_components/CourseHeader";
import { TopicSection } from "../_components/TopicSection";
import { ProgressSummary } from "../_components/ProgressSummary";

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
  const { courseTest, chapterTestBySectionId } = await getGridScopedTests(grid.id);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Learning", path: "/learning" },
          { name: grid.name, path: `/learning/${grid.slug}` },
        ])}
      />
      <JsonLd data={courseJsonLd({ name: grid.name, description: grid.description, path: `/learning/${grid.slug}` })} />
      <DocsShell tree={tree} gridSlug={grid.slug}>
        <Breadcrumb className="mb-4" items={[{ label: "Learning", href: "/learning" }, { label: grid.name }]} />

        <CourseHeader grid={grid} sectionCount={sections.length} topicCount={topicTotal} start={start} />

        {courseTest ? (
          <Button href={`/mock-tests/${courseTest.id}`} variant="secondary" leftIcon={ListChecks} className="mt-4">
            {courseTest.title}
          </Button>
        ) : null}

        <ProgressSummary gridSlug={grid.slug} />

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <TopicSection
              key={section.id}
              section={section}
              gridSlug={grid.slug}
              chapterTest={chapterTestBySectionId[section.id]}
            />
          ))}
        </div>
      </DocsShell>
    </>
  );
}
