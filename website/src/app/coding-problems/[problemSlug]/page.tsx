import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCodingProblem } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
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
  const { problem, topic } = detail;
  const description =
    (problem.description || `${problem.title} — a ${problem.difficulty} coding problem on CampusEduX.`)
      .replace(/[#>*`_|\-]+/g, " ")
      .trim()
      .slice(0, 155);
  const url = absoluteUrl(`/coding-problems/${problem.slug}`);
  return {
    title: `${problem.title} · Coding Problem`,
    description,
    alternates: { canonical: url },
    openGraph: { title: problem.title, description, url, type: "article" },
    twitter: { card: "summary", title: problem.title, description },
    other: { "topic:name": topic.title },
  };
}

export default async function CodingProblemPage({ params }: { params: { problemSlug: string } }) {
  const detail = await getCodingProblem(params.problemSlug);
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
          submitEndpoint="/api/coding-problems/submit"
          submissionsHref="/practice/submissions"
        />
      )}
    </>
  );
}
