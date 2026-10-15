import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Code2, Briefcase, FolderKanban, Newspaper, GraduationCap } from "lucide-react";
import { Breadcrumb } from "@/components/ui";
import { Markdown } from "@/components/learning/Markdown";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE, faqJsonLd } from "@/lib/seo";
import { cleanText, interviewTopicDescription } from "@/lib/metaDescription";
import { interviewTopicTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";
import { getInterviewTopicDetail } from "@/lib/interviewQuestions";
import { interviewQuestionsCrumbs, JAVA_TOPIC_LEARNING_LINKS } from "@/lib/interviewQuestions.types";

export const revalidate = 86400;
export const dynamicParams = true;

// [] registers the route for ISR without prerendering every topic at build
// time — mirrors the coding-problem and Learning topic pages.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { category: string; topic: string };
}): Promise<Metadata> {
  const detail = await getInterviewTopicDetail(params.category, params.topic);
  if (!detail || detail.questions.length === 0) return { title: "Not found", robots: { index: false, follow: false } };
  const { category, topic, questions } = detail;
  const title = interviewTopicTitle({ categoryName: category.name, topicName: topic.name });
  const description = interviewTopicDescription({
    categoryName: category.name,
    topicName: topic.name,
    topicDescription: topic.description,
    questions,
  });
  const url = absoluteUrl(`/practice/interview-questions/${category.slug}/${topic.slug}`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: BRAND.name,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function InterviewTopicPage({
  params,
}: {
  params: { category: string; topic: string };
}) {
  const detail = await getInterviewTopicDetail(params.category, params.topic);
  if (!detail || detail.questions.length === 0) notFound();
  const { category, topic, questions, prev, next } = detail;
  const basePath = `/practice/interview-questions/${category.slug}`;
  const learningLink = category.slug === "java" ? JAVA_TOPIC_LEARNING_LINKS[topic.slug] : undefined;

  const crumbs = interviewQuestionsCrumbs({
    categoryName: category.name,
    categorySlug: category.slug,
    topicName: topic.name,
  });

  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Practice", path: "/practice" },
          { name: "Interview Questions", path: "/practice/interview-questions" },
          { name: category.name, path: basePath },
          { name: topic.name, path: `${basePath}/${topic.slug}` },
        ])}
      />
      {/* Every question + answer below is rendered in full on the page. */}
      {questions.length > 0 ? (
        <JsonLd
          data={faqJsonLd(
            questions
              .map((q) => ({ question: cleanText(q.question), answer: cleanText(q.answer) }))
              .filter((q) => q.question && q.answer),
          )}
        />
      ) : null}
      <Breadcrumb items={crumbs} className="mb-4" />

      <header className="max-w-2xl">
        <p className="eyebrow">{category.name} Interview Questions</p>
        <h1 className="mt-2.5 text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-3xl">
          {topic.name} Interview Questions
        </h1>
        {topic.description ? <p className="lede mt-3">{topic.description}</p> : null}
      </header>

      {questions.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">Questions for this topic are being added — check back soon.</p>
      ) : (
        <div className="mt-8 max-w-none">
          {questions.map((q, i) => (
            <article key={i} className="border-t border-line py-7 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-bold text-ink">
                <span className="text-ink-faint">Question {i + 1}:</span> {q.question}
              </h2>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Ans</p>
                <Markdown source={q.answer} className="mt-1" />
              </div>

              {q.example ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Example</p>
                  <Markdown source={q.example} className="mt-1" />
                </div>
              ) : null}

              {q.important_point ? (
                <div className="mt-3 rounded-xl bg-warning/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Important Point</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{q.important_point}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <nav className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-6" aria-label="Topic navigation">
        {prev ? (
          <Link
            href={`${basePath}/${prev.slug}`}
            className="group flex flex-1 flex-col rounded-xl border border-line p-3 text-left hover:border-primary/30 hover:bg-surface"
          >
            <span className="flex items-center gap-1 text-xs text-ink-faint">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous Topic
            </span>
            <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">{prev.name}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`${basePath}/${next.slug}`}
            className="group flex flex-1 flex-col items-end rounded-xl border border-line p-3 text-right hover:border-primary/30 hover:bg-surface"
          >
            <span className="flex items-center gap-1 text-xs text-ink-faint">
              Next Topic <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">{next.name}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="section-title">Continue Your Preparation</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {learningLink ? (
            <Link href={learningLink.href} className="card card-hover flex items-center gap-3 p-4">
              <GraduationCap className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-ink">Learn the concept</span>
                <span className="block text-xs text-ink-faint">{learningLink.label}</span>
              </span>
            </Link>
          ) : null}
          <Link href="/practice/problems" className="card card-hover flex items-center gap-3 p-4">
            <Code2 className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-ink">Practice Coding Problems</span>
              <span className="block text-xs text-ink-faint">Solve problems in 5 languages</span>
            </span>
          </Link>
          <Link href="/jobs" className="card card-hover flex items-center gap-3 p-4">
            <Briefcase className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-ink">Explore Java Jobs</span>
              <span className="block text-xs text-ink-faint">Latest openings and internships</span>
            </span>
          </Link>
          <Link href="/projects" className="card card-hover flex items-center gap-3 p-4">
            <FolderKanban className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-ink">Explore Java Projects</span>
              <span className="block text-xs text-ink-faint">Build something for your resume</span>
            </span>
          </Link>
          <Link href="/blog" className="card card-hover flex items-center gap-3 p-4">
            <Newspaper className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-ink">Read Career Blogs</span>
              <span className="block text-xs text-ink-faint">Interview prep and career articles</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
