import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Hash,
  HelpCircle,
  Lightbulb,
  ListChecks,
  MessagesSquare,
  PencilLine,
  RotateCcw,
} from "lucide-react";
import type { LessonSectionKind } from "@/lib/lessonSections";
import { cn } from "@/lib/cn";

/** Literal class strings so Tailwind keeps them; tints read in both themes. */
const KIND: Record<LessonSectionKind | "other", { icon: LucideIcon; chip: string }> = {
  intro: { icon: BookOpen, chip: "bg-primary/10 text-primary" },
  why: { icon: HelpCircle, chip: "bg-accent-sky/15 text-blue-700 dark:text-blue-300" },
  example: { icon: Lightbulb, chip: "bg-warning/15 text-amber-700 dark:text-amber-300" },
  code: { icon: Code2, chip: "bg-accent-violet/15 text-violet-700 dark:text-violet-300" },
  keypoints: { icon: ListChecks, chip: "bg-success/15 text-success" },
  practice: { icon: PencilLine, chip: "bg-primary text-white" },
  mistakes: { icon: AlertTriangle, chip: "bg-danger/10 text-danger" },
  interview: { icon: MessagesSquare, chip: "bg-accent-teal/15 text-teal-700 dark:text-teal-300" },
  revision: { icon: RotateCcw, chip: "bg-accent-teal/15 text-teal-700 dark:text-teal-300" },
  other: { icon: Hash, chip: "border border-line bg-surface text-ink-faint" },
};

/**
 * A lesson section heading: kind icon chip + the heading text, with the
 * authored number ("6.") shown as a muted "06". Keeps the tag level and the
 * `id` the TOC links to. `framed` = sits inside a card / band (no big top gap).
 */
export function LessonHeading({
  as: Tag,
  id,
  kind,
  number,
  framed = false,
  chapter = false,
  children,
}: {
  as: keyof JSX.IntrinsicElements;
  id: string;
  kind: LessonSectionKind | null;
  number: string | null;
  framed?: boolean;
  /** A heading above the section level (a chapter holding several sections): larger, no chip. The authored `---` before it stays the divider. */
  chapter?: boolean;
  children: ReactNode;
}) {
  const num = number ? (
    <span className="mr-2 font-sans text-[0.8em] font-semibold tabular-nums text-ink-faint">{number.padStart(2, "0")}</span>
  ) : null;
  if (chapter) {
    return (
      <Tag
        id={id}
        className="mb-5 mt-14 scroll-mt-24 font-display text-[1.6rem] font-bold tracking-tight text-ink first:mt-2 sm:text-[1.8rem]"
      >
        {num}
        {children}
      </Tag>
    );
  }
  const s = KIND[kind ?? "other"];
  const Icon = s.icon;
  return (
    <Tag
      id={id}
      className={cn(
        "flex scroll-mt-24 items-center gap-3 font-display font-bold tracking-tight text-ink",
        framed ? "mb-3 text-[1.2rem] sm:text-[1.3rem]" : "mb-4 mt-12 text-[1.3rem] first:mt-2 sm:text-[1.45rem]",
      )}
    >
      <span className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", s.chip)}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="min-w-0">
        {num}
        {children}
      </span>
    </Tag>
  );
}

/**
 * Wraps a heading + its content as one unit:
 *  • `keypoints` — a green summary card (bullets become ticks, see Markdown)
 *  • `practice`  — a self-check card, set apart from the reading flow
 *  • `code`      — a light band tying Syntax / Example Program to its code + Output
 */
export function LessonSectionFrame({ kind, children }: { kind: LessonSectionKind; children: ReactNode }) {
  if (kind === "practice") {
    return (
      <section className="relative my-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-accent-pink/[0.05] p-4 shadow-card sm:p-6">
        <span className="absolute right-4 top-4 hidden rounded-full border border-primary/20 bg-card px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary sm:inline-flex">
          Self-check
        </span>
        {children}
      </section>
    );
  }
  if (kind === "keypoints") {
    return <section className="my-10 rounded-2xl border border-success/25 bg-success/[0.06] p-4 sm:p-6">{children}</section>;
  }
  return (
    <section className="my-10 rounded-2xl border border-line border-l-[3px] border-l-accent-violet/60 bg-surface/60 p-3 sm:p-5">
      {children}
    </section>
  );
}

/** One numbered question inside a Practice card: number chip + heading + its body. */
export function PracticeQuestion({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-primary/10 py-4 first:border-t-0 last:pb-0">
      <NumberChip n={number} />
      <div className="min-w-0 flex-1 [&>*:first-child]:mt-0.5">{children}</div>
    </div>
  );
}

export function NumberChip({ n }: { n: string }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-card text-sm font-bold tabular-nums text-primary shadow-card">
      {n}
    </span>
  );
}

/**
 * `**Answer:** …` inside a Practice card, behind a native "Show answer"
 * toggle (no JS; the answer stays in the HTML for search engines).
 */
export function PracticeAnswer({ children }: { children: ReactNode }) {
  return (
    <details className="group/ans mt-2.5 rounded-xl border border-line bg-card/80">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-success transition hover:bg-success/[0.06] [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-open/ans:rotate-90 motion-reduce:transition-none" aria-hidden />
        <span className="group-open/ans:hidden">Show answer</span>
        <span className="hidden group-open/ans:inline">Hide answer</span>
      </summary>
      <div className="px-4 pb-3 leading-7 text-ink-muted">{children}</div>
    </details>
  );
}

/** Key-points bullet: a tick instead of a disc. */
export function KeyPointItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 leading-relaxed">
      <CheckCircle2 className="mt-[0.3rem] h-4 w-4 flex-shrink-0 text-success" aria-hidden />
      <span className="min-w-0 text-ink">{children}</span>
    </li>
  );
}
