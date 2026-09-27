import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLearningTree, getLearningGridBrief, getLearningGridSlugs, getGridScopedTests } from "@/lib/learning";
import { toOutline } from "@/lib/courseOutline";
import JsonLd from "@/components/JsonLd";
import { Breadcrumb } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd, courseJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { CourseHero } from "../_components/CourseHero";
import { CourseCurriculum } from "../_components/CourseCurriculum";
import { CourseCta } from "../_components/CourseCta";
import { ProgressSummary } from "../_components/ProgressSummary";

export const revalidate = 21600;
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
      images: grid.cover_image_url ? [{ url: grid.cover_image_url }] : [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Course overview. Server-rendered header + full curriculum (every lesson link
 * in the HTML); progress, the resume CTA and bookmarks hydrate on the client
 * from device-only progress / the visitor's own bookmarks.
 */
export default async function GridOverviewPage({ params }: { params: { gridSlug: string } }) {
  const [brief, tree] = await Promise.all([getLearningGridBrief(params.gridSlug), getLearningTree(params.gridSlug)]);
  if (!brief || !tree) notFound();
  const { grid } = tree;
  const outline = toOutline(tree);
  const { courseTest, chapterTestBySectionId } = await getGridScopedTests(grid.id);
  const testCount = (courseTest ? 1 : 0) + Object.keys(chapterTestBySectionId).length;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Learning", path: "/learning" },
          { name: grid.name, path: `/learning/${grid.slug}` },
        ])}
      />
      <JsonLd data={courseJsonLd({ name: grid.name, description: grid.description, path: `/learning/${grid.slug}` })} />
      <div className="container-page pb-32 pt-6 sm:pt-8 md:pb-24 lg:pb-16">
        <Breadcrumb className="mb-5" items={[{ label: "Learning", href: "/learning" }, { label: grid.name }]} />

        <CourseHero
          brief={brief}
          outline={outline}
          description={grid.description}
          coverImageUrl={grid.cover_image_url}
          testCount={testCount}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0">
            <ProgressSummary gridSlug={grid.slug} />
            <div className="mt-6">
              <CourseCurriculum outline={outline} chapterTests={chapterTestBySectionId} />
            </div>
          </div>
          <aside className="lg:sticky lg:top-24" aria-label="Course progress">
            <CourseCta outline={outline} courseTest={courseTest} />
          </aside>
        </div>
      </div>
    </>
  );
}
