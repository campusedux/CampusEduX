"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/**
 * Error state — mirrors `mobile-app/src/components/ui/StateViews.tsx`
 * `ErrorState`. Never render a raw DB/network error string here — pass a
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
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="h-8 w-8 text-danger" aria-hidden />
      <p className="mt-3 font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
