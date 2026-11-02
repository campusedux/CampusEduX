"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ErrorState } from "@/components/ui";
import type { CustomProjectReadFailure } from "@/lib/customProjectReads";

export function LoadError({ kind, onRetry }: { kind: CustomProjectReadFailure; onRetry?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div>
    <ErrorState title={kind === "unauthorized" ? "Sign in required" : kind === "unavailable" ? "Custom project data is unavailable" : "Could not load your project"}
      message={kind === "unauthorized" ? "Please sign in again to access your saved project." : "Your saved draft has not been changed. Please try again in a moment."}
      onRetry={pending || kind === "unauthorized" ? undefined : () => startTransition(() => onRetry ? onRetry() : router.refresh())}
      retryLabel="Retry" />
    {pending && <p role="status">Retrying…</p>}
    {kind === "unauthorized" && <Link href="/login">Sign in</Link>}
  </div>;
}
