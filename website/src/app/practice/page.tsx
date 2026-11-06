import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Code2, TerminalSquare, History, MessageSquareText, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getPracticeCategories } from "@/lib/practice";

export const revalidate = 21600;

export const metadata: Metadata = completeSeoMetadata({
  title: "Coding Practice & Interview Prep",
  description: "Solve coding problems, prepare for interviews and run code online with CampusEduX practice tools for students.",
  alternates: { canonical: absoluteUrl("/practice") },
  openGraph: {
    title: "Coding Practice & Interview Prep | CampusEduX",
    description: "Solve coding problems, prepare for interviews and run code online with CampusEduX practice tools for students.",
    url: absoluteUrl("/practice"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

const TILES = [
  {
    href: "/practice/problems",
    icon: Code2,
    title: "Coding Problems",
    body: "Solve a growing library of problems — the same problem in Java, Python, C, C++ or JavaScript. Filter by difficulty, topic and progress.",
    tint: "#4F39F6",
    bg: "#EEF0FF",
  },
  {
    href: "/compiler",
    icon: TerminalSquare,
    title: "Online Compiler",
    body: "A quick scratchpad — write and run code in five languages in a secure sandbox, no problem attached.",
    tint: "#0D9488",
    bg: "#CCFBF1",
  },
  {
    href: "/practice/submissions",
    icon: History,
    title: "Submissions",
    body: "Every solution you submit, with its verdict, language, run time and the tests it passed.",
    tint: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    href: "/practice/interview-questions",
    icon: MessageSquareText,
    title: "Interview Questions",
    body: "Interview questions and answers by topic — a clear answer, an example, and a key point to remember for every question.",
    tint: "#DB2777",
    bg: "#FCE7F3",
  },
];

export default async function PracticeHubPage() {
  const categories = await getPracticeCategories();
  const totalProblems = categories.reduce((n, c) => n + (c.problem_count || 0), 0);

  return (
    <div className="page-shell">
      <JsonLd data={breadcrumbJsonLd([{ name: "Practice", path: "/practice" }])} />
      <Breadcrumb className="mb-4" items={[{ label: "Practice" }]} />
      <PageHeader
        eyebrow="Practice"
        title="Practice"
        description="Coding problems, an online compiler and your submission history — one system, separate from Learning."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-4 max-md:mt-4 max-md:!grid-cols-2 max-md:gap-3">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="card card-hover group flex min-h-[160px] min-w-0 flex-col p-4 max-md:min-h-[136px] max-md:p-3"
          >
            <div className="flex min-w-0 items-center gap-3 max-md:flex-col max-md:items-start max-md:gap-2">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl max-md:h-9 max-md:w-9"
                style={{ background: t.bg, color: t.tint }}
                aria-hidden
              >
                <t.icon className="h-5 w-5" />
              </span>
              <h2 className="min-w-0 text-base font-semibold text-ink max-md:line-clamp-2 max-md:text-[15px] max-md:leading-snug">{t.title}</h2>
            </div>
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-5 text-ink-muted max-md:mt-1 max-md:text-[13px] max-md:leading-4">{t.body}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary max-md:hidden">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>

      {categories.length > 0 ? (
        <section className="mt-10 max-md:mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="section-title">Browse by topic</h2>
            <span className="text-sm text-ink-faint">
              {totalProblems} problem{totalProblems === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/practice/problems?category=${encodeURIComponent(c.slug)}`}
                className="inline-flex min-w-0 items-center justify-between gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
              >
                <span className="min-w-0 truncate">{c.name}</span>
                <span className="rounded-full bg-surface px-1.5 text-xs font-semibold text-ink-faint">
                  {c.problem_count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
