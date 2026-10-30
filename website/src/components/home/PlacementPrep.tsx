import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ClipboardList, Code2, MessageSquareText, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui";

interface PrepCard {
  href: string;
  title: string;
  body: string;
  cta: string;
  icon: LucideIcon;
  /** Real count from the catalogue, or undefined when there's no source for one. */
  count?: string;
  tile: string;
  fg: string;
}

/**
 * Home "Placement prep" — links into the existing Practice / Learning / Compiler
 * routes. Counts come from the live catalogue and are omitted when zero.
 */
export function PlacementPrep({ problemCount, interviewTopicCount }: { problemCount: number; interviewTopicCount: number }) {
  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
  const cards: PrepCard[] = [
    {
      href: "/practice/problems",
      title: "Coding problems",
      body: "Solve problems in Java, Python, C, C++ or JavaScript with instant feedback on every run.",
      cta: "Start coding",
      icon: Code2,
      count: problemCount > 0 ? `${fmt(problemCount)} problems` : undefined,
      tile: "bg-accent-pink/10",
      fg: "text-accent-pink",
    },
    {
      href: "/learning",
      title: "Mock tests",
      body: "Timed tests on each tutorial topic to see how exam-ready you are.",
      cta: "Take a test",
      icon: ClipboardList,
      tile: "bg-primary-50",
      fg: "text-primary",
    },
    {
      href: "/practice/interview-questions",
      title: "Interview questions",
      body: "Common interview questions by topic, with clear answers and key points to remember.",
      cta: "Prepare for interviews",
      icon: MessageSquareText,
      count: interviewTopicCount > 0 ? `${fmt(interviewTopicCount)} topics` : undefined,
      tile: "bg-accent-sky/10",
      fg: "text-accent-sky",
    },
    {
      href: "/compiler",
      title: "Online compiler",
      body: "Write and run code in your browser — no setup, nothing to install.",
      cta: "Open compiler",
      icon: TerminalSquare,
      tile: "bg-accent-teal/10",
      fg: "text-accent-teal",
    },
  ];

  return (
    <section className="container-page pt-14 sm:pt-20" aria-labelledby="home-prep-title">
      <SectionHeader
        id="home-prep-title"
        eyebrow="Placement prep"
        title="Get interview-ready"
        description="Practise the way placement rounds actually test you."
        viewAllHref="/practice"
        viewAllLabel="All practice"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} prefetch={c.href === "/compiler" ? false : undefined} className="card card-hover group flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", c.tile)}>
                  <Icon className={cn("h-5 w-5", c.fg)} aria-hidden />
                </span>
                {c.count && (
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted">{c.count}</span>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink group-hover:text-primary">{c.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-ink-muted">{c.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {c.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PlacementPrep;
