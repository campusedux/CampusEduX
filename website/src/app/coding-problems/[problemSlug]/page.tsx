import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import { getCodingProblem } from "@/lib/learning";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { CodingProblemBody } from "./CodingProblemBody";
import { CodingProblemPremiumGate } from "./CodingProblemPremiumGate";

export const revalidate = 300;
export const dynamicParams = true;

const DIFF_CLASS: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-700",
};

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
      <div className="container-page py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-faint">
          <Link href="/learning" className="hover:text-ink">
            Learning
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link href={backToTopic} className="hover:text-ink">
            {topic.title}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-ink-faint">Coding Problem</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{problem.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-medium ${DIFF_CLASS[problem.difficulty] ?? "bg-surface text-ink-muted"}`}>
              {problem.difficulty}
            </span>
            {problem.supported_languages?.length ? (
              <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-ink-muted">
                {problem.supported_languages.join(" · ")}
              </span>
            ) : null}
            {problem.is_premium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
              </span>
            ) : null}
          </div>
        </header>

        {locked ? (
          <CodingProblemPremiumGate slug={problem.slug} loginNext={`/coding-problems/${problem.slug}`} />
        ) : (
          <CodingProblemBody detail={detail} />
        )}
      </div>
    </>
  );
}
