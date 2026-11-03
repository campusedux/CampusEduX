import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, ArrowRight } from "lucide-react";
import { PageHeader, Breadcrumb } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getInterviewCategories } from "@/lib/interviewQuestions";
import { interviewQuestionsCrumbs } from "@/lib/interviewQuestions.types";

export const revalidate = 21600;
// An unavailable catalog must not be prerendered as a successful empty hub.
export const dynamic = "force-dynamic";

const TITLE = "Interview Questions & Answers by Topic | CampusEduX";
const DESCRIPTION =
  "Programming interview questions and answers by language, organized topic by topic — each with a clear answer, a code example and a key point to remember.";

const baseMetadata: Metadata = completeSeoMetadata({
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/practice/interview-questions") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/practice/interview-questions"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getInterviewCategories();
  return { ...baseMetadata, robots: categories.some((category) => category.topic_count > 0) ? undefined : { index: false, follow: true } };
}

// Only Java exists today; a fixed icon keeps this page free of a dynamic
// icon-name lookup for a single, known category — mirrors the hardcoded
// icons on the Practice hub's own tiles.
const CATEGORY_ICON = Coffee;

export default async function InterviewQuestionsHubPage() {
  const categories = await getInterviewCategories();

  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd(
          interviewQuestionsCrumbs().map((c) => ({ name: c.label, path: c.href ?? "/practice/interview-questions" })),
        )}
      />
      <Breadcrumb items={interviewQuestionsCrumbs()} className="mb-4" />
      <PageHeader
        eyebrow="Practice"
        title="Interview Questions"
        description="Interview questions and answers, organized by topic — a clear answer, a code example, and a key point to remember for every question."
      />

      {categories.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">Interview questions are being added — check back soon.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-4 max-md:mt-4 max-md:!grid-cols-2 max-md:gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/practice/interview-questions/${c.slug}`}
              className="card card-hover group flex min-h-[160px] min-w-0 flex-col p-4 max-md:min-h-[136px] max-md:p-3"
            >
              <div className="flex min-w-0 items-center gap-3 max-md:flex-col max-md:items-start max-md:gap-2">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"
                  aria-hidden
                >
                  <CATEGORY_ICON className="h-5 w-5" />
                </span>
                <h2 className="min-w-0 text-base font-semibold text-ink max-md:text-[15px] max-md:leading-snug">{c.name}</h2>
              </div>
              <p className="mt-2 line-clamp-2 flex-1 text-sm leading-5 text-ink-muted max-md:mt-1 max-md:text-[13px] max-md:leading-4">{c.description}</p>
              <span className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary inline-flex items-center gap-1">
                  <span className="max-md:hidden">Open</span> <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="text-ink-faint">
                  {c.topic_count} topic{c.topic_count === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
