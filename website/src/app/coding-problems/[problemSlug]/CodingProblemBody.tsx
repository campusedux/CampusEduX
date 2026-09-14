import type { CodingProblemDetail } from "@/lib/learning.types";
import CodingProblemWorkspace from "./CodingProblemWorkspace";
import { CodingProblemLayout } from "./_components/CodingProblemLayout";
import { ProblemPanel, type ProblemCrumb } from "./_components/ProblemPanel";

/**
 * The full, unlocked Coding Problem view: a resizable two-panel IDE workspace.
 *
 * Left — `ProblemPanel` (breadcrumb → title → badges → tabbed statement /
 * examples / constraints / hints / editorial), rendered on the server so the
 * problem text stays in the initial HTML for SEO.
 *
 * Right — `CodingProblemWorkspace`, the existing stateful compiler (language
 * select, drafts, Run / Run Tests, judge output).
 *
 * Shared verbatim by the Learning topic-practice route (`/coding-problems/*`,
 * defaults) and the global Practice route (`/practice/problems/*`, which passes
 * `nav`, `judgeEndpoint` and `submitEndpoint`).
 */
export function CodingProblemBody({
  detail,
  nav,
  judgeEndpoint,
  submitEndpoint,
  submissionsHref,
}: {
  detail: CodingProblemDetail;
  nav?: ProblemCrumb[];
  judgeEndpoint?: string;
  submitEndpoint?: string;
  submissionsHref?: string;
}) {
  const { problem } = detail;
  const exampleInputs = (problem.examples ?? []).map((ex) => ex.input ?? "");

  return (
    <CodingProblemLayout
      left={<ProblemPanel detail={detail} nav={nav} />}
      right={
        <CodingProblemWorkspace
          slug={problem.slug}
          supportedLanguages={problem.supported_languages ?? []}
          starterCode={problem.starter_code ?? {}}
          exampleInputs={exampleInputs}
          judgeEndpoint={judgeEndpoint}
          submitEndpoint={submitEndpoint}
          submissionsHref={submissionsHref}
        />
      }
    />
  );
}

export default CodingProblemBody;
