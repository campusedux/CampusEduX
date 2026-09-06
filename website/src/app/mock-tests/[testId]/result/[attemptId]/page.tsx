import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X, ChevronRight } from "lucide-react";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getMockTest } from "@/lib/learning";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface QRow {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  sort_order: number;
}

export default async function MockTestResultPage({
  params,
}: {
  params: { testId: string; attemptId: string };
}) {
  const supabase = createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Own-row RLS on test_attempts — someone else's attempt id comes back null.
  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("id,test_id,score,total_marks,correct_count,incorrect_count,time_taken_seconds,created_at")
    .eq("id", params.attemptId)
    .maybeSingle();
  if (!attempt || attempt.test_id !== params.testId) notFound();

  const [{ data: answerRows }, { data: questionRows }, test] = await Promise.all([
    supabase.from("test_attempt_answers").select("question_id,selected_index,is_correct").eq("attempt_id", attempt.id),
    supabase
      .from("test_questions")
      .select("id,question_text,options,correct_index,explanation,sort_order")
      .eq("test_id", attempt.test_id)
      .order("sort_order", { ascending: true }),
    getMockTest(params.testId),
  ]);

  const questions = (questionRows ?? []) as QRow[];
  const answers = new Map(
    (answerRows ?? []).map((a) => [a.question_id as string, a.selected_index as number | null]),
  );
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

      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Review</h2>
        {questions.map((q, i) => {
          const chosen = answers.get(q.id);
          const correct = q.correct_index;
          const wasCorrect = chosen != null && chosen === correct;
          return (
            <div key={q.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start gap-2">
                {wasCorrect ? (
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden />
                ) : (
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" aria-hidden />
                )}
                <p className="font-medium text-ink">
                  Q{i + 1}. {q.question_text}
                </p>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === correct;
                  const isChosen = oi === chosen;
                  return (
                    <li
                      key={oi}
                      className={`rounded-lg border px-3 py-2 ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : isChosen
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-line text-ink-muted"
                      }`}
                    >
                      {opt}
                      {isCorrect ? " · correct answer" : isChosen ? " · your answer" : ""}
                    </li>
                  );
                })}
              </ul>
              {chosen == null ? <p className="mt-2 text-xs text-ink-faint">Not answered.</p> : null}
              {q.explanation ? (
                <p className="mt-2 border-t border-line pt-2 text-sm text-ink-muted">
                  <span className="font-medium text-ink">Explanation: </span>
                  {q.explanation}
                </p>
              ) : null}
            </div>
          );
        })}
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
    <div className="rounded-xl border border-line bg-white p-3 text-center shadow-card">
      <div
        className={`text-lg font-bold ${
          tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-ink-faint">{label}</div>
    </div>
  );
}
