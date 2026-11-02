import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { loadTestAttemptReview } from "@/lib/testAttemptReview";
import { TestAttemptReview } from "@/components/learning/TestAttemptReview";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getMockTest } from "@/lib/learning";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MockTestResultPage({
  params: paramsPromise,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const params = await paramsPromise;
  const supabase = await createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const review = await loadTestAttemptReview(supabase, params.testId, params.attemptId);
  if (!review) notFound();
  const { attempt } = review;
  const test = await getMockTest(params.testId);
  const totalMarks = attempt.total_marks || 0;
  const accuracy = totalMarks > 0 ? Math.round((attempt.score / totalMarks) * 100) : 0;
  const mins = Math.floor((attempt.time_taken_seconds || 0) / 60);
  const secs = (attempt.time_taken_seconds || 0) % 60;
  const backToTopic = test?.topic ? `/learning/${test.topic.grid_slug}/${test.topic.topic_slug}` : "/learning";

  return (
    <div className="container-prose py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-faint">
        <Link href="/learning" className="hover:text-ink">
          Learning
        </Link>
        {test?.topic ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href={backToTopic} className="hover:text-ink">
              {test.topic.title}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink-faint">Result</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{test?.title ?? "Mock Test"} — Result</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Score" value={`${attempt.score} / ${totalMarks}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Correct" value={String(attempt.correct_count ?? 0)} tone="good" />
        <Stat label="Incorrect" value={String(attempt.incorrect_count ?? 0)} tone="bad" />
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Time taken: {mins}m {secs}s · Submitted {new Date(attempt.created_at).toLocaleString()}
      </p>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Review</h2>
        <TestAttemptReview review={review} showSummary={false} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={backToTopic} className="btn-primary h-10 px-4 text-sm">
          Back to topic
        </Link>
        <Link
          href={`/mock-tests/${params.testId}`}
          className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-medium text-ink hover:bg-surface"
        >
          Retake test
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 text-center shadow-card">
      <div
        className={`text-lg font-bold ${
          tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-ink-faint">{label}</div>
    </div>
  );
}
