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
    <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-prep-title">
      <SectionHeader
        id="home-prep-title"
        eyebrow="Placement prep"
        title="Get interview-ready"
        description="Practise the way placement rounds actually test you."
        viewAllHref="/practice"
        viewAllLabel="All practice"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4 max-md:!grid-cols-2 max-md:gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} prefetch={c.href === "/compiler" ? false : undefined} className="card card-hover group flex min-h-[150px] min-w-0 flex-col p-4 max-md:relative max-md:min-h-[136px] max-md:p-3">
              <div className="flex min-w-0 items-center gap-3 max-md:flex-wrap max-md:gap-1">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl max-md:h-9 max-md:w-9", c.tile)}>
                  <Icon className={cn("h-5 w-5", c.fg)} aria-hidden />
                </span>
                <h3 className="min-w-0 flex-1 line-clamp-2 font-display text-base font-semibold text-ink group-hover:text-primary max-md:basis-full max-md:text-[15px] max-md:leading-snug">{c.title}</h3>
                {c.count && (
                  <span className="shrink-0 rounded-full bg-surface px-2 py-1 text-xs font-semibold text-ink-muted max-md:order-3 max-md:px-1.5 max-md:py-0.5 max-md:text-[10px]">{c.count}</span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 flex-1 text-sm leading-5 text-ink-muted max-md:mt-1 max-md:text-[13px] max-md:leading-4">{c.body}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary max-md:hidden">
                {c.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
              </span>
              <ArrowRight className="hidden h-4 w-4 text-primary max-md:absolute max-md:right-3 max-md:top-3 max-md:block" aria-hidden />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PlacementPrep;
