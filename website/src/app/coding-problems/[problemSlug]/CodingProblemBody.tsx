import { Markdown } from "@/components/learning/Markdown";
import type { CodingProblemDetail } from "@/lib/learning.types";
import CodingProblemWorkspace from "./CodingProblemWorkspace";
import { ProblemCompilerSplit } from "./ProblemCompilerSplit";

/**
 * The full, unlocked Coding Problem view: a split-screen layout — the problem
 * statement (description → examples → constraints → hints → editorial) in an
 * independently-scrolling, resizable ~40% left column, the existing editor +
 * Run + Run Tests workspace in the ~60% right column (`ProblemCompilerSplit`
 * owns just the resize mechanic as a client island; this component stays a
 * server component so the statement below still renders in the initial HTML).
 * Directive-less so it renders on the server (free problem) and inside the
 * client premium-gate island (premium member) alike. Only the container
 * markup here is new — every field still comes straight off `detail`, nothing
 * hardcoded, and `CodingProblemWorkspace` (editor, language select,
 * Run/Reset/Run Tests, judge output) is untouched apart from its own internal
 * stacking (see that file).
 */
export function CodingProblemBody({ detail }: { detail: CodingProblemDetail }) {
  const { problem, editorial, solution_approach } = detail;
  const firstExampleInput = problem.examples?.[0]?.input ?? "";

  const problemPanel = (
    <div className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-6">
      {problem.description ? <Markdown source={problem.description} /> : null}

      {problem.examples?.length ? (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Examples</h2>
          <div className="mt-2 space-y-3">
            {problem.examples.map((ex, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface/60 p-3 text-sm">
                <div className="font-medium text-ink">Example {i + 1}</div>
                {ex.input !== undefined ? (
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-[13px] text-ink-muted">
                    <span className="text-ink-faint">Input: </span>
                    {ex.input || "(none)"}
                  </pre>
                ) : null}
                {ex.output !== undefined ? (
                  <pre className="whitespace-pre-wrap font-mono text-[13px] text-ink-muted">
                    <span className="text-ink-faint">Output: </span>
                    {ex.output}
                  </pre>
                ) : null}
                {ex.explanation ? (
                  <p className="mt-1 text-xs text-ink-faint">Explanation: {ex.explanation}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {problem.constraints?.length ? (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Constraints</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {problem.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {problem.hints?.length ? (
        <details className="rounded-xl border border-line bg-surface/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            Hints ({problem.hints.length})
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-muted">
            {problem.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </details>
      ) : null}

      {editorial || solution_approach ? (
        <details className="rounded-xl border border-line bg-surface/60 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">Editorial</summary>
          <div className="mt-3 space-y-3">
            {solution_approach ? <p className="text-sm text-ink-muted">{solution_approach}</p> : null}
            {editorial ? <Markdown source={editorial} /> : null}
          </div>
        </details>
      ) : null}
    </div>
  );

  const compilerPanel = (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Your solution</h2>
      <p className="mt-1 text-xs text-ink-faint">
        Code runs in a secure sandbox. Use <strong>Run</strong> for a quick check with custom input, or{" "}
        <strong>Run Tests</strong> to check every test case.
      </p>
      <div className="mt-3">
        <CodingProblemWorkspace
          slug={problem.slug}
          supportedLanguages={problem.supported_languages ?? []}
          starterCode={problem.starter_code ?? {}}
          firstExampleInput={firstExampleInput}
        />
      </div>
    </div>
  );

  return <ProblemCompilerSplit left={problemPanel} right={compilerPanel} />;
}

export default CodingProblemBody;
