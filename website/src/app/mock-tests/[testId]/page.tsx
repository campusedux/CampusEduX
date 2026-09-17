import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, ListChecks, Lock, Gauge } from "lucide-react";
import { getMockTest } from "@/lib/learning";
import { MockTestRunner } from "./MockTestRunner";

// Auth-gated attempt flow — never index.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MockTestPage({ params }: { params: { testId: string } }) {
  const test = await getMockTest(params.testId);
  if (!test) notFound();
  const backToTopic = test.topic ? `/learning/${test.topic.grid_slug}/${test.topic.topic_slug}` : "/learning";

  return (
    <div className="container-prose py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-faint">
        <Link href="/learning" className="hover:text-ink">
          Learning
        </Link>
        {test.topic ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href={backToTopic} className="hover:text-ink">
              {test.topic.title}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-faint">Mock Test</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{test.title}</h1>
        {test.description ? <p className="mt-3 text-ink-muted">{test.description}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-4 w-4 text-ink-faint" aria-hidden /> {test.question_count} question
            {test.question_count === 1 ? "" : "s"}
          </span>
          {test.duration_minutes ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink-faint" aria-hidden /> {test.duration_minutes} min
            </span>
          ) : null}
          {test.difficulty ? (
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-ink-faint" aria-hidden /> {test.difficulty}
            </span>
          ) : null}
          {test.is_premium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Premium
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Instructions</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
          <li>• {test.question_count} multiple-choice question{test.question_count === 1 ? "" : "s"}.</li>
          <li>• {test.duration_minutes ? `${test.duration_minutes} minutes` : "No time limit"}. The timer starts when you click Start.</li>
          <li>
            •{" "}
            {test.negative_marking > 0
              ? `Negative marking: −${test.negative_marking} per wrong answer.`
              : "No negative marking."}
          </li>
          <li>• You can move between questions and change answers before submitting.</li>
          <li>• Your score is calculated on the server when you submit.</li>
        </ul>
        {test.instructions ? (
          <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm text-ink-muted">{test.instructions}</p>
        ) : null}
      </div>

      <MockTestRunner
        testId={test.id}
        title={test.title}
        durationMinutes={test.duration_minutes}
        isPremium={test.is_premium}
        resultBase={`/mock-tests/${test.id}`}
        scope={test.scope}
      />
    </div>
  );
}
