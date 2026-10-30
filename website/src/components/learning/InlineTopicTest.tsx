"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { TopicMockTestCard } from "@/lib/learning.types";

const Runner = dynamic(() => import("@/app/mock-tests/[testId]/MockTestRunner").then((module) => module.MockTestRunner), {
  loading: () => <p role="status" className="mt-4 text-sm text-ink-muted">Loading test controls…</p>,
});

/** Defers the authenticated SDK and test runner until the student chooses a test. */
export function InlineTopicTest({ test }: { test: TopicMockTestCard }) {
  const [opened, setOpened] = useState(false);
  return opened ? (
    <Runner testId={test.id} title={test.title} durationMinutes={test.duration_minutes} isPremium={test.is_premium} resultBase={`/mock-tests/${test.id}`} inline />
  ) : (
    <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline" onClick={() => setOpened(true)}>
      Open test here
    </button>
  );
}
