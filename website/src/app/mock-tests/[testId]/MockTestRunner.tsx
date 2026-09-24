"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/browser";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  marks: number;
}

type Phase =
  | { k: "gate" }
  | { k: "signin" }
  | { k: "intro" }
  | { k: "loading" }
  | { k: "premium" }
  | { k: "error"; message: string }
  | { k: "quiz"; questions: Question[] }
  | { k: "submitting" };

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MockTestRunner({
  testId,
  durationMinutes,
  isPremium,
  resultBase,
  scope = "topic",
}: {
  testId: string;
  title: string;
  durationMinutes: number;
  isPremium: boolean;
  resultBase: string;
  /** 'chapter' / 'course' tests sample a random pool via practice_test_questions()
   *  and score via submit_randomized_test_attempt() instead of the plain
   *  per-topic test_questions() and submit_test_attempt() paths. */
  scope?: "topic" | "chapter" | "course";
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [phase, setPhase] = useState<Phase>({ k: "gate" });
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const startedAt = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setPhase(user ? { k: "intro" } : { k: "signin" });
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const startTest = useCallback(async () => {
    setPhase({ k: "loading" });
    let questions: Question[];
    if (scope === "topic") {
      const { data, error } = await supabase
        .from("test_questions")
        .select("id,question_text,options,marks,sort_order")
        .eq("test_id", testId)
        .order("sort_order", { ascending: true });
      if (error) {
        setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
        return;
      }
      questions = (data ?? []).map((r) => ({
        id: r.id as string,
        question_text: r.question_text as string,
        options: (r.options ?? []) as string[],
        marks: (r.marks ?? 1) as number,
      }));
    } else {
      // Chapter / course tests: a fresh random sample every attempt, drawn
      // server-side from the live pool (practice_test_pool, 0091/063).
      const { data, error } = await supabase.rpc("practice_test_questions", { p_test_id: testId, p_platform: "website" });
      if (error) {
        setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
        return;
      }
      questions = (Array.isArray(data) ? data : []).map((r) => ({
        id: r.id as string,
        question_text: r.question_text as string,
        options: (r.options ?? []) as string[],
        marks: (r.marks ?? 1) as number,
      }));
    }
    if (questions.length === 0) {
      setPhase(isPremium ? { k: "premium" } : { k: "error", message: "This test has no questions yet." });
      return;
    }
    startedAt.current = Date.now();
    setSecondsLeft(durationMinutes > 0 ? durationMinutes * 60 : null);
    setCurrent(0);
    setAnswers({});
    setPhase({ k: "quiz", questions });
  }, [supabase, testId, durationMinutes, isPremium, scope]);

  const submit = useCallback(
    async (questions: Question[]) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase({ k: "submitting" });
      const payload = questions.map((q) => ({
        question_id: q.id,
        selected_index: q.id in answers ? answers[q.id] : null,
      }));
      const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
      const { data, error } =
        scope === "topic"
          ? await supabase.rpc("submit_test_attempt", {
              p_test_id: testId,
              p_answers: payload,
              p_time_taken_seconds: timeTaken,
            })
          : await supabase.rpc("submit_randomized_test_attempt", {
              p_test_id: testId,
              p_question_ids: questions.map((q) => q.id),
              p_answers: payload,
              p_time_taken_seconds: timeTaken,
            });
      const attempt = Array.isArray(data) ? data[0] : data;
      if (error || !attempt?.id) {
        submittedRef.current = false;
        setPhase({
          k: "error",
          message: error?.message ? `Couldn't submit: ${error.message}` : "Couldn't submit your test. Please try again.",
        });
        return;
      }
      router.push(`${resultBase}/result/${attempt.id}`);
    },
    [answers, supabase, testId, resultBase, router, scope],
  );

  // countdown
  useEffect(() => {
    if (phase.k !== "quiz" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      void submit(phase.questions);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft, submit]);

  // ---- render ----
  if (phase.k === "gate") {
    return (
      <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking your session…
      </p>
    );
  }

  if (phase.k === "signin") {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center shadow-card">
        <h2 className="text-lg font-bold text-ink">Sign in to take this test</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          Your answers are scored on the server and saved to your account.
        </p>
        <Button href={`/login?next=${encodeURIComponent(resultBase)}`} className="mt-4">
          Sign in
        </Button>
      </div>
    );
  }

  if (phase.k === "premium") {
    return (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-amber-500" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-ink">This is a premium test</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          Upgrade to CampusEduX Premium to attempt this mock test.
        </p>
        <Button href="/premium" className="mt-4">
          See Premium plans
        </Button>
      </div>
    );
  }

  if (phase.k === "error") {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-5 text-sm text-red-700" role="alert">
        {phase.message}
        <div className="mt-3">
          <Button variant="ghost" onClick={() => setPhase({ k: "intro" })}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (phase.k === "intro") {
    return (
      <div className="mt-6">
        <Button onClick={startTest} className="w-full sm:w-auto">
          Start Mock Test
        </Button>
      </div>
    );
  }

  if (phase.k === "loading" || phase.k === "submitting") {
    return (
      <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {phase.k === "loading" ? "Loading questions…" : "Submitting…"}
      </p>
    );
  }

  // quiz
  const { questions } = phase;
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">
          Question {current + 1} / {questions.length}
        </span>
        {secondsLeft !== null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {fmt(secondsLeft)}
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {questions.map((qq, i) => {
          const done = qq.id in answers;
          const active = i === current;
          return (
            <button
              key={qq.id}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to question ${i + 1}${done ? " (answered)" : ""}`}
              className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
                active
                  ? "bg-primary text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-700"
                    : "border border-line bg-card text-ink-faint"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <fieldset className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <legend className="sr-only">Question {current + 1}</legend>
        <p className="text-base font-medium text-ink">{q.question_text}</p>
        <div className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  selected ? "border-primary bg-primary-50 text-primary" : "border-line text-ink hover:bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={selected}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  className="h-4 w-4"
                />
                <span className="flex-1">{opt}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((i) => i - 1)}>
          Previous
        </Button>
        {current === questions.length - 1 ? (
          <Button
            onClick={() => {
              const unanswered = questions.length - answeredCount;
              if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
                return;
              }
              void submit(questions);
            }}
          >
            Submit Test
          </Button>
        ) : (
          <Button onClick={() => setCurrent((i) => i + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}

export default MockTestRunner;
