"use client";

import { ErrorState, PageHeader } from "@/components/ui";

export default function CatalogError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mobile-discovery page-shell">
      <PageHeader title="Jobs & Internships" />
      <ErrorState className="mt-4" id="jobs-error-title" title="Jobs are temporarily unavailable." message="We couldn’t load the job listings. Please try again in a moment." onRetry={reset} retryLabel="Retry" />
    </div>
  );
}
