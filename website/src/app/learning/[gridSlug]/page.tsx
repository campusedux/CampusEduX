import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLearningTree, getLearningGridBrief, getGridScopedTests } from "@/lib/learning";
import { toOutline } from "@/lib/courseOutline";
import JsonLd from "@/components/JsonLd";
import { Breadcrumb } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd, courseJsonLd } from "@/lib/seo";
import { courseDescription } from "@/lib/metaDescription";
import { courseTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";
import { CourseHero } from "../_components/CourseHero";
import { CourseCurriculum } from "../_components/CourseCurriculum";
import { CourseCta } from "../_components/CourseCta";
import { ProgressSummary } from "../_components/ProgressSummary";

export const revalidate = 0; // Publication changes must be checked on each render.
export const dynamicParams = true;

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ gridSlug: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const [grid, tree] = await Promise.all([getLearningGridBrief(params.gridSlug), getLearningTree(params.gridSlug)]);
  if (!grid) return { title: "Learning resource not found", robots: { index: false, follow: false } };
  const lessonCount = tree ? tree.sections.reduce((n, s) => n + s.topics.length, 0) : 0;
  const chapterCount = tree ? tree.sections.filter((s) => s.topics.length > 0).length : 0;
  const title = courseTitle({ courseName: grid.name, lessonCount });
  const description = courseDescription({ courseName: grid.name, description: grid.description, lessonCount, chapterCount });
  const url = absoluteUrl(`/learning/${grid.slug}`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: BRAND.name,
      // A real cover image wins; otherwise no `images` key, so this route's
      // opengraph-image.tsx (course title card) is used instead.
      ...(grid.cover_image_url ? { images: [{ url: grid.cover_image_url }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Course overview. Server-rendered header + full curriculum (every lesson link
 * in the HTML); progress, the resume CTA and bookmarks hydrate on the client
 * from device-only progress / the visitor's own bookmarks.
 */
export default async function GridOverviewPage({ params: paramsPromise }: { params: Promise<{ gridSlug: string }> }) {
  const params = await paramsPromise;
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
      <div className="container-page min-w-0 pb-24 pt-4 [overflow-wrap:anywhere] md:pt-6 md:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-16">
        <Breadcrumb className="mb-3 sm:mb-4" items={[{ label: "Learning", href: "/learning" }, { label: grid.name }]} />

        <CourseHero
          brief={brief}
          outline={outline}
          description={grid.description}
          coverImageUrl={grid.cover_image_url}
          testCount={testCount}
        />

        <div className="mt-5 grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <ProgressSummary gridSlug={grid.slug} />
            <div className="mt-4">
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
