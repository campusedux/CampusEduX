import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPracticeProblem } from "@/lib/practice";
import { practiceCrumbs } from "@/lib/practice.types";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { CodingProblemBody } from "@/app/coding-problems/[problemSlug]/CodingProblemBody";
import { PracticeProblemPremiumGate } from "./PracticeProblemPremiumGate";

export const revalidate = 300;
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
  const { problem, category } = detail;
  const description = (problem.description || `${problem.title} — a ${problem.difficulty} coding problem on CampusEduX.`)
    .replace(/[#>*`_|\-]+/g, " ")
    .trim()
    .slice(0, 155);
  const url = absoluteUrl(`/practice/problems/${problem.slug}`);
  return {
    title: `${problem.title} · Practice`,
    description,
    alternates: { canonical: url },
    openGraph: { title: problem.title, description, url, type: "article" },
    twitter: { card: "summary", title: problem.title, description },
    other: { "topic:name": category?.name ?? "Practice" },
  };
}

export default async function PracticeProblemPage({ params }: { params: { slug: string } }) {
  const detail = await getPracticeProblem(params.slug);
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
          judgeEndpoint={JUDGE_ENDPOINT}
          submitEndpoint={SUBMIT_ENDPOINT}
          submissionsHref={SUBMISSIONS_HREF}
        />
      )}
    </>
  );
}
