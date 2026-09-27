import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, ArrowRight } from "lucide-react";
import { PageHeader, Breadcrumb } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getInterviewCategories } from "@/lib/interviewQuestions";
import { interviewQuestionsCrumbs } from "@/lib/interviewQuestions.types";

export const revalidate = 21600;

const TITLE = "Interview Questions & Answers by Topic | CampusEduX";
const DESCRIPTION =
  "Programming interview questions and answers by language, organized topic by topic — each with a clear answer, a code example and a key point to remember.";

export const metadata: Metadata = {
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
};

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
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/practice/interview-questions/${c.slug}`}
              className="card card-hover group flex flex-col p-5"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary"
                aria-hidden
              >
                <CATEGORY_ICON className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink">{c.name}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{c.description}</p>
              <span className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary inline-flex items-center gap-1">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
