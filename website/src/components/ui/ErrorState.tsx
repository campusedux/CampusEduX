"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/**
 * Error state. Never render a raw DB/network error string here — pass a
 * user-friendly message.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "Please try again in a moment.",
  onRetry,
  className,
  retryLabel = "Try again",
  id,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  retryLabel?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "discovery-error flex min-w-0 flex-col items-center justify-center rounded-2xl border border-line bg-card px-4 py-10 text-center [overflow-wrap:anywhere] sm:px-6 sm:py-14",
        className,
      )}
      role="alert"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
        <AlertCircle className="h-7 w-7 text-danger" aria-hidden />
      </span>
      <h2 id={id} className="mt-4 font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
