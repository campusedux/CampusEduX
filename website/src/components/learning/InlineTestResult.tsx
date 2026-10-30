"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadTestAttemptReview, type AttemptReview } from "@/lib/testAttemptReview";
import { TestAttemptReview } from "./TestAttemptReview";

export function InlineTestResult({ testId, attemptId, onRetake }: {
  testId: string;
  attemptId: string;
  onRetake: () => void;
}) {
  const [review, setReview] = useState<AttemptReview | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setReview(null);
    loadTestAttemptReview(createBrowserSupabase(), testId, attemptId).then((result) => {
      if (active) {
        setReview(result);
        setFailed(!result);
      }
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [testId, attemptId, retry]);

  return (
    <div>
      {review ? <TestAttemptReview review={review} /> : failed ? (
        <div role="alert" className="mt-4 text-sm text-ink-muted">
          Your attempt was saved, but its review could not be loaded.
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="ml-2 min-h-11 font-semibold text-primary underline">Retry review</button>
        </div>
      ) : <p role="status" className="mt-4 text-sm text-ink-muted">Loading your saved result…</p>}
      <div className="mt-4 flex flex-wrap gap-4">
        <button type="button" onClick={onRetake} className="btn-primary min-h-11 px-4">Retake test</button>
        <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline" href={`/mock-tests/${testId}/result/${attemptId}`}>Open saved result</Link>
      </div>
    </div>
  );
}
