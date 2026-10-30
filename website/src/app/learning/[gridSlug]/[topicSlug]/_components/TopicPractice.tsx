import Link from "next/link";
import { ArrowRight, ClipboardList, Code2, Lock } from "lucide-react";
import { getTopicPractice } from "@/lib/learning";
import { InlineTopicTest } from "@/components/learning/InlineTopicTest";
import { Suspense } from "react";
import { InlineCodingProblem } from "./InlineCodingProblem";

/**
 * The Mock Tests + Coding Problems attached to a Learning topic. Rendered at the
 * bottom of the topic page, AFTER the topic content, BEFORE the prev/next nav.
 *
 * Renders nothing when the topic has no practice at all, and renders only the
 * section(s) that have content — never an empty "Mock Tests" / "Coding Problems"
 * heading (master prompt §2). Premium items show a lock; their detail pages
 * (`/mock-tests/[id]`, `/coding-problems/[slug]`) enforce access.
 */
export async function TopicPractice({ gridSlug, topicSlug }: { gridSlug: string; topicSlug: string }) {
  const { mock_tests, coding_problems } = await getTopicPractice(gridSlug, topicSlug);
  if (mock_tests.length === 0 && coding_problems.length === 0) return null;
  const inlineTests = gridSlug === "dbms-sql-tutorial";

  return (
    <section className="mt-10 border-t border-line pt-8" aria-label="Practice">
      {mock_tests.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden /> Mock Test
            {mock_tests.length > 1 ? "s" : ""}
          </h2>
          <ul className={`mt-3 grid gap-3 ${inlineTests ? "" : "sm:grid-cols-2"}`}>
            {mock_tests.map((t) => (
              <li key={t.id} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  {inlineTests ? <h3 className="font-semibold text-ink">{t.title}</h3> : <span className="font-semibold text-ink">{t.title}</span>}
                  {t.is_premium ? (
                    <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" aria-hidden />
                  ) : null}
                </div>
                {t.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{t.description}</p>
                ) : null}
                <div className="mt-2 text-xs text-ink-faint">
                  {t.question_count} question{t.question_count === 1 ? "" : "s"}
                  {t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}
                  {t.difficulty ? ` · ${t.difficulty}` : ""}
                </div>
                {inlineTests ? <InlineTopicTest test={t} /> : <Link
                  href={`/mock-tests/${t.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Start Mock Test <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {coding_problems.length > 0 && (
        <div className={mock_tests.length > 0 ? "mt-8" : ""}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Code2 className="h-5 w-5 text-primary" aria-hidden /> Coding Problem
            {coding_problems.length > 1 ? "s" : ""}
          </h2>
          <ul className={`mt-3 grid gap-3 ${inlineTests ? "" : "sm:grid-cols-2"}`}>
            {coding_problems.map((p) => inlineTests ? (
              <li key={p.id}>
                <Suspense fallback={<p className="p-4 text-sm text-ink-muted">Loading {p.title}…</p>}>
                  <InlineCodingProblem card={p} gridSlug={gridSlug} topicSlug={topicSlug} />
                </Suspense>
              </li>
            ) : (
              <li key={p.id} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-ink">{p.title}</span>
                  {p.is_premium ? (
                    <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" aria-hidden />
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-ink-faint">
                  {p.difficulty}
                  {p.supported_languages?.length ? ` · ${p.supported_languages.join(", ")}` : ""}
                </div>
                <Link
                  href={`/coding-problems/${p.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Solve Problem <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default TopicPractice;
