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
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-card px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
        <AlertCircle className="h-7 w-7 text-danger" aria-hidden />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
