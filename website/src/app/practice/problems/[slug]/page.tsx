import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPracticeProblem, getPracticeProblemRelated } from "@/lib/practice";
import { practiceCrumbs } from "@/lib/practice.types";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { problemDescription } from "@/lib/metaDescription";
import { problemLanguage, problemTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";
import { CodingProblemBody } from "@/app/coding-problems/[problemSlug]/CodingProblemBody";
import { PracticeProblemPremiumGate } from "./PracticeProblemPremiumGate";

export const revalidate = 86400;
export const dynamicParams = true;

// [] registers the route for ISR without prerendering every problem at build time.
export function generateStaticParams() {
  return [];
}

const JUDGE_ENDPOINT = "/api/practice/judge";
const SUBMIT_ENDPOINT = "/api/practice/submit";
const SUBMISSIONS_HREF = "/practice/submissions";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const detail = await getPracticeProblem(params.slug);
  if (!detail) return { title: "Coding problem not found", robots: { index: false, follow: false } };
  const { problem, category, locked } = detail;
  // Locked problems stay indexable (same convention as the Learning topic
  // page), but `problem.description` is nulled server-side for a locked
  // problem — so the fallback here must describe only what the premium gate
  // actually shows (title, difficulty, category, a premium notice), never the
  // withheld statement.
  const categoryName = category?.name ?? "Practice";
  // The global library is solvable in several languages → "Coding" unless a
  // problem supports exactly one.
  const language = problemLanguage({ supportedLanguages: problem.supported_languages });
  const title = problemTitle({ problemTitle: problem.title, language });
  const description = problemDescription({
    title: problem.title,
    difficulty: problem.difficulty,
    language,
    topicName: categoryName,
    statement: locked ? null : problem.description,
    locked,
  });
  const url = absoluteUrl(`/practice/problems/${problem.slug}`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // No `images` key: this route's opengraph-image.tsx (problem title card) is used.
    openGraph: { title, description, url, type: "article", siteName: BRAND.name },
    twitter: { card: "summary_large_image", title, description },
    other: { "topic:name": categoryName },
  };
}

export default async function PracticeProblemPage({ params }: { params: { slug: string } }) {
  const [detail, relatedData] = await Promise.all([
    getPracticeProblem(params.slug),
    getPracticeProblemRelated(params.slug),
  ]);
  if (!detail) notFound();
  const { problem, category, locked } = detail;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Practice", path: "/practice" },
          { name: "Coding Problems", path: "/practice/problems" },
          { name: problem.title, path: `/practice/problems/${problem.slug}` },
        ])}
      />
      {locked ? (
        <PracticeProblemPremiumGate
          problem={problem}
          categoryName={category?.name ?? "Practice"}
          slug={problem.slug}
          loginNext={`/practice/problems/${problem.slug}`}
        />
      ) : (
        <CodingProblemBody
          detail={detail}
          nav={practiceCrumbs(problem.title)}
          related={relatedData?.related}
          adjacent={relatedData ? { prev: relatedData.prev, next: relatedData.next } : undefined}
          problemBasePath="/practice/problems"
          judgeEndpoint={JUDGE_ENDPOINT}
          submitEndpoint={SUBMIT_ENDPOINT}
          submissionsHref={SUBMISSIONS_HREF}
        />
      )}
    </>
  );
}
