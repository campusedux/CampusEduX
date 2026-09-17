import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCodingProblem, getCodingProblemRelated } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { CodingProblemBody } from "./CodingProblemBody";
import { CodingProblemPremiumGate } from "./CodingProblemPremiumGate";

export const revalidate = 300;
export const dynamicParams = true;

// [] still registers the route for ISR (on-demand renders are cached for
// `revalidate` seconds) without prerendering every problem at build time.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { problemSlug: string };
}): Promise<Metadata> {
  const detail = await getCodingProblem(params.problemSlug);
  if (!detail) return { title: "Coding problem not found", robots: { index: false, follow: false } };
  const { problem, topic, locked } = detail;
  // Locked problems stay indexable (same convention as the Learning topic
  // page), but `problem.description` is nulled server-side for a locked
  // problem — so the fallback here must describe only what the premium gate
  // actually shows (title, difficulty, topic, a premium notice), never the
  // withheld statement.
  const fallback = locked
    ? `${problem.title} is a ${problem.difficulty} ${topic.title} coding problem on CampusEduX. It's a Premium problem — unlock it to view the full statement, examples and code editor.`
    : `${problem.title} — a ${problem.difficulty} coding problem on CampusEduX.`;
  const description = (problem.description || fallback)
    .replace(/[#>*`_|\-]+/g, " ")
    .trim()
    .slice(0, 155);
  const url = absoluteUrl(`/coding-problems/${problem.slug}`);
  return {
    title: `${problem.title} · Coding Problem`,
    description,
    alternates: { canonical: url },
    openGraph: { title: problem.title, description, url, type: "article", images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary", title: problem.title, description },
    other: { "topic:name": topic.title },
  };
}

export default async function CodingProblemPage({ params }: { params: { problemSlug: string } }) {
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
