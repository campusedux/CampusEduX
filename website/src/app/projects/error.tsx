"use client";

import { ErrorState, PageHeader } from "@/components/ui";

export default function CatalogError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mobile-discovery page-shell">
      <PageHeader title="Project Marketplace" />
      <ErrorState className="mt-4" id="projects-error-title" title="Projects are temporarily unavailable." message="We couldn’t load the project catalogue. Please try again in a moment." onRetry={reset} retryLabel="Retry" />
    </div>
  );
}
