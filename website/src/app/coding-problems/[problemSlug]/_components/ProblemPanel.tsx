import { canonicalContentPath } from "@/lib/contentRedirects";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Lock } from "lucide-react";
import { Markdown } from "@/components/learning/Markdown";
import type { AdjacentProblem, CodingProblemDetail, RelatedProblemCard } from "@/lib/learning.types";
import { cn } from "@/lib/cn";
import { ProblemTabs } from "./ProblemTabs";
import { ProblemSolution } from "./ProblemSolution";

const DIFF_CLASS: Record<string, string> = {
  Easy: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-amber-800 dark:text-amber-300",
  Hard: "bg-danger/10 text-danger",
};

/** A breadcrumb crumb: a label, plus an href for every crumb except the last. */
export type ProblemCrumb = { label: string; href?: string };

/** Default breadcrumb for the Learning topic-practice route: `Learning →
 *  topic → <problem title>`. Pure, so it's unit-testable without rendering. */
export function defaultProblemCrumbs(detail: CodingProblemDetail): ProblemCrumb[] {
  const { problem, topic } = detail;
  return [
    { label: "Learning", href: "/learning" },
    { label: topic.title, href: `/learning/${topic.grid_slug}/${topic.topic_slug}` },
    { label: problem.title },
  ];
}

/**
 * Left column of the coding workspace: breadcrumb → title → difficulty /
 * language badges → the tabbed problem card. A plain (directive-less) component
 * so it renders in the server HTML for a free problem and inside the client
 * premium-gate island for a member alike. Every field comes straight off
 * `detail` — nothing is hardcoded.
 *
 * `nav` overrides the breadcrumb: the Learning topic-practice route lets it
 * default to `Learning → topic → <problem title>`; the global Practice route
 * passes `Practice → Coding Problems → <problem title>`.
 *
 * `related`/`adjacent` are the internal-linking additions from migration
 * 0102/074 (`coding_problem_related` / `practice_problem_related`) — optional
 * so callers that don't pass them (none currently) render unchanged.
 * `problemBasePath` picks the right route prefix for those links: topic-
 * scoped problems live under `/coding-problems`, Practice problems under
 * `/practice/problems` — the two systems are never cross-linked.
 */
export function ProblemPanel({
  detail,
  nav,
  related,
  adjacent,
  problemBasePath = "/coding-problems",
  embedded = false,
}: {
  detail: CodingProblemDetail;
  nav?: ProblemCrumb[];
  related?: RelatedProblemCard[];
  adjacent?: { prev: AdjacentProblem | null; next: AdjacentProblem | null };
  problemBasePath?: string;
  embedded?: boolean;
}) {
  const { problem, topic, editorial, solution_approach } = detail;
  const crumbs: ProblemCrumb[] = nav ?? defaultProblemCrumbs(detail);
  const Heading = embedded ? "h3" : "h1";
  // Only the Learning topic-scoped system has a real tutorial relationship in
  // the data model — Practice problems (empty grid_slug/topic_slug, see
  // `getPracticeProblem`) never get a fabricated "Learn the Concept" link.
  const tutorialHref = topic.grid_slug && topic.topic_slug ? `/learning/${topic.grid_slug}/${topic.topic_slug}` : null;

  const statement = problem.description ? (
    <Markdown source={problem.description} />
  ) : (
    <p className="text-sm text-ink-faint">The full statement for this problem is in the examples and constraints below.</p>
  );

  const examples = problem.examples?.length ? (
    <div className="space-y-3">
      {problem.examples.map((ex, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface/60 p-3 text-sm">
          <div className="font-semibold text-ink">Example {i + 1}</div>
          {ex.input !== undefined ? (
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Input</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-card px-2.5 py-2 font-mono text-[13px] text-ink-muted">
                {ex.input || "(none)"}
              </pre>
            </div>
          ) : null}
          {ex.output !== undefined ? (
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Output</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-card px-2.5 py-2 font-mono text-[13px] text-ink-muted">
                {ex.output}
              </pre>
            </div>
          ) : null}
          {ex.explanation ? <p className="mt-2 text-xs text-ink-faint">Explanation: {ex.explanation}</p> : null}
        </div>
      ))}
    </div>
  ) : null;

  const constraints = problem.constraints?.length ? (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-muted marker:text-ink-faint">
      {problem.constraints.map((c, i) => (
        <li key={i} className="font-mono text-[13px]">
          {c}
        </li>
      ))}
    </ul>
  ) : null;

  const hints = problem.hints?.length ? (
    <div className="space-y-2">
      {problem.hints.map((h, i) => (
        <details key={i} className="group rounded-xl border border-line bg-surface/60 px-3 py-2.5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-ink-faint transition-transform group-open:rotate-90" aria-hidden />
              Hint {i + 1}
            </span>
          </summary>
          <p className="mt-2 pl-6 text-sm text-ink-muted">{h}</p>
        </details>
      ))}
    </div>
  ) : null;

  const solutionKind = problemBasePath === "/practice/problems" ? "practice" : "coding";
  const editorialNode =
    editorial || solution_approach || detail.solution_locked === true ? (
      <div className="space-y-3">
        {solution_approach ? <p className="text-sm text-ink-muted">{solution_approach}</p> : null}
        {editorial ? <Markdown source={editorial} /> : null}
        {detail.solution_locked === true ? <ProblemSolution kind={solutionKind} slug={problem.slug} /> : null}
      </div>
    ) : null;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      {!embedded && <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-ink-faint">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden /> : null}
            {c.href ? (
              <Link href={c.href} className="truncate transition-colors hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className="text-ink-muted">{c.label}</span>
            )}
          </span>
        ))}
      </nav>}

      <Heading className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{problem.title}</Heading>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 font-semibold",
            DIFF_CLASS[problem.difficulty] ?? "bg-surface text-ink-muted",
          )}
        >
          {problem.difficulty}
        </span>
        {(problem.supported_languages ?? []).map((lang) => (
          <span key={lang} className="rounded-full bg-surface px-2.5 py-1 font-semibold text-ink-muted">
            {lang}
          </span>
        ))}
        {problem.is_premium ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 font-semibold text-amber-800 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
          </span>
        ) : null}
      </div>

      {tutorialHref && !embedded ? (
        <Link
          href={tutorialHref}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <BookOpen className="h-4 w-4" aria-hidden /> Learn the Concept: {topic.title}
        </Link>
      ) : null}

      <div className="mt-4">
        <ProblemTabs
          problem={statement}
          examples={examples}
          constraints={constraints}
          hints={hints}
          editorial={editorialNode}
        />
      </div>

      {related?.length ? (
        <section className="mt-8 border-t border-line pt-6" aria-label="Related Problems">
          <h2 className="text-lg font-bold text-ink">Related Problems</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-ink">{r.title}</span>
                  {r.is_premium ? (
                    <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" aria-hidden />
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-ink-faint">
                  {r.difficulty}
                  {r.supported_languages?.length ? ` · ${r.supported_languages.join(", ")}` : ""}
                </div>
                <Link
                  href={canonicalContentPath(`${problemBasePath}/${r.slug}`)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Solve Problem <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {adjacent?.prev || adjacent?.next ? (
        <nav className="mt-8 flex items-stretch justify-between gap-3 border-t border-line pt-6" aria-label="Problem navigation">
          {adjacent.prev ? (
            <Link
              href={`${problemBasePath}/${adjacent.prev.slug}`}
              className="group flex flex-1 flex-col rounded-xl border border-line p-3 text-left hover:border-primary/30 hover:bg-surface"
            >
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous Problem
              </span>
              <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">
                {adjacent.prev.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {adjacent.next ? (
            <Link
              href={`${problemBasePath}/${adjacent.next.slug}`}
              className="group flex flex-1 flex-col items-end rounded-xl border border-line p-3 text-right hover:border-primary/30 hover:bg-surface"
            >
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                Next Problem <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="mt-0.5 text-sm font-semibold text-ink group-hover:text-primary">
                {adjacent.next.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      ) : null}
    </div>
  );
}

export default ProblemPanel;
