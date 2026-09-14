import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { Markdown } from "@/components/learning/Markdown";
import type { CodingProblemDetail } from "@/lib/learning.types";
import { cn } from "@/lib/cn";
import { ProblemTabs } from "./ProblemTabs";

const DIFF_CLASS: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-700",
};

/** A breadcrumb crumb: a label, plus an href for every crumb except the last. */
export type ProblemCrumb = { label: string; href?: string };

/**
 * Left column of the coding workspace: breadcrumb → title → difficulty /
 * language badges → the tabbed problem card. A plain (directive-less) component
 * so it renders in the server HTML for a free problem and inside the client
 * premium-gate island for a member alike. Every field comes straight off
 * `detail` — nothing is hardcoded.
 *
 * `nav` overrides the breadcrumb: the Learning topic-practice route lets it
 * default to `Learning → topic → "Coding Problem"`; the global Practice route
 * passes `Practice → Coding Problems → "Coding Problem"`.
 */
export function ProblemPanel({ detail, nav }: { detail: CodingProblemDetail; nav?: ProblemCrumb[] }) {
  const { problem, topic, editorial, solution_approach } = detail;
  const backToTopic = `/learning/${topic.grid_slug}/${topic.topic_slug}`;
  const crumbs: ProblemCrumb[] =
    nav ?? [
      { label: "Learning", href: "/learning" },
      { label: topic.title, href: backToTopic },
      { label: "Coding Problem" },
    ];

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
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white px-2.5 py-2 font-mono text-[13px] text-ink-muted">
                {ex.input || "(none)"}
              </pre>
            </div>
          ) : null}
          {ex.output !== undefined ? (
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Output</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white px-2.5 py-2 font-mono text-[13px] text-ink-muted">
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

  const editorialNode =
    editorial || solution_approach ? (
      <div className="space-y-3">
        {solution_approach ? <p className="text-sm text-ink-muted">{solution_approach}</p> : null}
        {editorial ? <Markdown source={editorial} /> : null}
      </div>
    ) : null;

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-ink-faint">
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
      </nav>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{problem.title}</h1>

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
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <ProblemTabs
          problem={statement}
          examples={examples}
          constraints={constraints}
          hints={hints}
          editorial={editorialNode}
        />
      </div>
    </div>
  );
}

export default ProblemPanel;
