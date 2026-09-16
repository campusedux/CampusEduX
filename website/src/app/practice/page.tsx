import type { Metadata } from "next";
import Link from "next/link";
import { Code2, TerminalSquare, History, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { getPracticeCategories } from "@/lib/practice";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Practise programming with CampusEduX — a global library of coding problems solvable in Java, Python, C, C++ and JavaScript, an online compiler, and your submission history.",
  alternates: { canonical: absoluteUrl("/practice") },
  openGraph: {
    title: "Practice | CampusEduX",
    description: "Coding problems, an online compiler, and your submissions — all in one place.",
    url: absoluteUrl("/practice"),
    type: "website",
  },
};

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
];

export default async function PracticeHubPage() {
  const categories = await getPracticeCategories();
  const totalProblems = categories.reduce((n, c) => n + (c.problem_count || 0), 0);

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <JsonLd data={breadcrumbJsonLd([{ name: "Practice", path: "/practice" }])} />
      <PageHeader
        eyebrow="Practice"
        title="Practice"
        description="Coding problems, an online compiler and your submission history — one system, separate from Learning."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="card card-hover group flex flex-col p-6"
          >
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: t.bg, color: t.tint }}
              aria-hidden
            >
              <t.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink">{t.title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{t.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>

      {categories.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="section-title">Browse by topic</h2>
            <span className="text-sm text-ink-faint">
              {totalProblems} problem{totalProblems === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/practice/problems?category=${encodeURIComponent(c.slug)}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-muted transition hover:border-primary/40 hover:text-ink"
              >
                {c.name}
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
