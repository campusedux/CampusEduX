import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHeader, Breadcrumb } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getInterviewTopics } from "@/lib/interviewQuestions";
import { interviewQuestionsCrumbs } from "@/lib/interviewQuestions.types";

export const revalidate = 300;
export const dynamicParams = true;

// [] registers the route for ISR without prerendering every category at
// build time — mirrors practice/problems and the Learning topic pages.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const page = await getInterviewTopics(params.category);
  if (!page) return { title: "Not found", robots: { index: false, follow: false } };
  const url = absoluteUrl(`/practice/interview-questions/${page.category.slug}`);
  const description =
    page.category.description ||
    `${page.category.name} interview questions and answers, organized by topic, on CampusEduX.`;
  return {
    title: `${page.category.name} Interview Questions`,
    description: description.slice(0, 155),
    alternates: { canonical: url },
    openGraph: {
      title: `${page.category.name} Interview Questions | CampusEduX`,
      description: description.slice(0, 155),
      url,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function InterviewCategoryPage({ params }: { params: { category: string } }) {
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Link
              key={t.slug}
              href={`/practice/interview-questions/${category.slug}/${t.slug}`}
              className="card card-hover group flex flex-col p-5"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary"
                aria-hidden
              >
                <BookOpen className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-base font-bold text-ink">{t.name}</h2>
              {t.description ? (
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{t.description}</p>
              ) : (
                <span className="flex-1" />
              )}
              <span className="mt-4 flex items-center justify-between text-sm">
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
