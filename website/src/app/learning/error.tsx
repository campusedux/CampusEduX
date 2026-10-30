"use client";

import { ErrorState, PageHeader } from "@/components/ui";

export default function CatalogError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mobile-discovery page-shell">
      <PageHeader title="Learning" />
      <ErrorState className="mt-4" id="learning-error-title" title="Learning are temporarily unavailable." message="We couldn’t load the courses. Please try again in a moment." onRetry={reset} retryLabel="Retry" />
    </div>
  );
}
