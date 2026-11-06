import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCodingProblem, getCodingProblemRelated } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { problemDescription } from "@/lib/metaDescription";
import { problemLanguage, problemTitle } from "@/lib/seoTitles";
import { BRAND } from "@/lib/brand";
import { CodingProblemBody } from "./CodingProblemBody";
import { CodingProblemPremiumGate } from "./CodingProblemPremiumGate";

// Request-specific CSP nonces cannot be reused in statically cached HTML.
// Existing data-layer caches still serve public content reads.
export const dynamic = "force-dynamic";
export const revalidate = 86400;
export const dynamicParams = true;

// Retained route enumeration; HTML itself renders per request for nonce safety.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ problemSlug: string }>;
}): Promise<Metadata> {
  const params = await paramsPromise;
  const detail = await getCodingProblem(params.problemSlug);
  if (!detail) return completeSeoMetadata({ title: "Coding problem not found", robots: { index: false, follow: false } }, { dynamicImage: true });
  const { problem, topic, locked } = detail;
  // Locked problems stay indexable (same convention as the Learning topic
  // page), but `problem.description` is nulled server-side for a locked
  // problem — so a locked description describes only what the premium gate
  // actually shows (title, difficulty, topic, a premium notice), never the
  // withheld statement (`locked` is checked here, not just a falsy statement).
  const language = problemLanguage({ supportedLanguages: problem.supported_languages, gridSlug: topic.grid_slug });
  const title = problemTitle({ problemTitle: problem.title, language });
  const description = problemDescription({
    title: problem.title,
    difficulty: problem.difficulty,
    language,
    topicName: topic.title,
    statement: locked ? null : problem.description,
    locked,
  });
  const url = absoluteUrl(`/coding-problems/${problem.slug}`);
  // No examples, constraints, or starter code -> nothing but a generic
  // description actually renders (a currently-unrewritten seed batch).
  // Don't index a page that thin; unaffected pages (which all have at least
  // one of these populated) are untouched.
  const isThin =
    !locked &&
    problem.examples.length === 0 &&
    problem.constraints.length === 0 &&
    Object.keys(problem.starter_code ?? {}).length === 0;
  return completeSeoMetadata({
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // No `images` key: this route's opengraph-image.tsx (problem title card) is used.
    openGraph: { title, description, url, type: "article", siteName: BRAND.name },
    twitter: { card: "summary_large_image", title, description },
    other: { "topic:name": topic.title },
    robots: isThin ? { index: false, follow: true } : undefined,
  }, { dynamicImage: true });
}

export default async function CodingProblemPage({ params: paramsPromise }: { params: Promise<{ problemSlug: string }> }) {
  const params = await paramsPromise;
  const [detail, relatedData] = await Promise.all([
    getCodingProblem(params.problemSlug),
    getCodingProblemRelated(params.problemSlug),
  ]);
  if (!detail) notFound();
  const { problem, topic, locked } = detail;
  const backToTopic = `/learning/${topic.grid_slug}/${topic.topic_slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Learning", path: "/learning" },
          { name: topic.title, path: backToTopic },
          { name: problem.title, path: `/coding-problems/${problem.slug}` },
        ])}
      />
      {locked ? (
        <CodingProblemPremiumGate
          problem={problem}
          topic={topic}
          slug={problem.slug}
          loginNext={`/coding-problems/${problem.slug}`}
        />
      ) : (
        <CodingProblemBody
          detail={detail}
          related={relatedData?.related}
          adjacent={relatedData ? { prev: relatedData.prev, next: relatedData.next } : undefined}
          submitEndpoint="/api/coding-problems/submit"
          submissionsHref="/practice/submissions"
        />
      )}
    </>
  );
}
