import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHeader, Breadcrumb } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { interviewCategoryDescription } from "@/lib/metaDescription";
import { interviewCategoryTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";
import { getInterviewTopics } from "@/lib/interviewQuestions";
import { interviewQuestionsCrumbs } from "@/lib/interviewQuestions.types";

// Request-specific CSP nonces cannot be reused in statically cached HTML.
// Existing data-layer caches still serve public content reads.
export const dynamic = "force-dynamic";
export const revalidate = 21600;
export const dynamicParams = true;

// Retained route enumeration; HTML itself renders per request for nonce safety.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const page = await getInterviewTopics(params.category).catch(() => undefined);
  // An outage cannot establish an empty category. The page read remains required.
  if (page === undefined) return { title: "Interview Questions" };
  if (!page) return completeSeoMetadata({ title: "Not found", robots: { index: false, follow: false } });
  const url = absoluteUrl(`/practice/interview-questions/${page.category.slug}`);
  const title = interviewCategoryTitle(page.category.name);
  const description = interviewCategoryDescription({
    categoryName: page.category.name,
    categoryDescription: page.category.description,
    topics: page.topics,
  });
  return completeSeoMetadata({
    title: { absolute: title },
    description,
    robots: page.topics.length === 0 ? { index: false, follow: true } : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: BRAND.name,
      images: [DEFAULT_OG_IMAGE],
    },
  });
}

export default async function InterviewCategoryPage({ params: paramsPromise }: { params: Promise<{ category: string }> }) {
  const params = await paramsPromise;
  const page = await getInterviewTopics(params.category);
  if (!page) notFound();
  const { category, topics } = page;

  const crumbs = interviewQuestionsCrumbs({ categoryName: category.name, categorySlug: category.slug });

  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd(
          crumbs.map((c) => ({ name: c.label, path: c.href ?? `/practice/interview-questions/${category.slug}` })),
        )}
      />
      <Breadcrumb items={crumbs} className="mb-4" />
      <PageHeader
        eyebrow="Interview Questions"
        title={`${category.name} Interview Questions`}
        description={category.description || undefined}
      />

      {topics.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">Topics are being added — check back soon.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-4 max-md:mt-4 max-md:!grid-cols-2 max-md:gap-3">
          {topics.map((t) => (
            <Link
              key={t.slug}
              href={`/practice/interview-questions/${category.slug}/${t.slug}`}
              className="card card-hover group flex min-h-[150px] min-w-0 flex-col p-4 max-md:min-h-[136px] max-md:p-3"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary"
                aria-hidden
              >
                <BookOpen className="h-5 w-5" />
              </span>
              <h2 className="mt-2 line-clamp-2 text-base font-semibold text-ink max-md:text-[15px] max-md:leading-snug">{t.name}</h2>
              {t.description ? (
                <p className="mt-1 line-clamp-2 flex-1 text-sm leading-5 text-ink-muted max-md:text-[13px] max-md:leading-4">{t.description}</p>
              ) : (
                <span className="flex-1" />
              )}
              <span className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary inline-flex items-center gap-1">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="text-ink-faint">
                  {t.question_count} question{t.question_count === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
