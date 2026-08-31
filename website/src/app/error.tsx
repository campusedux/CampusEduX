"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui";

/** Global route error boundary. Never surfaces the raw error text to the user. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to the browser console for debugging; no PII, no user-facing dump.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <ErrorState
        title="This page hit a snag"
        message="Something went wrong loading this page. It’s usually temporary — try again."
        onRetry={reset}
      />
    </div>
  );
}
