"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { VerifyEmailStatus } from "@/app/api/auth/verify-email/route";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-6 text-center shadow-card sm:p-8">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2" aria-label="CampusEduX home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-black text-white">
            C
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Campus<span className="text-primary">EduX</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}

/**
 * Verification does NOT run on page load. A confirmation token is single-use,
 * and email-security gateways (Outlook Safe Links "time-of-click" scanning,
 * some corporate mail proxies) fetch/render a link's page before the person
 * ever sees it — if that fired verifyOtp automatically, the scanner would
 * burn the token and the real user would always land on "Link expired". It
 * only runs once the person makes an explicit gesture (this button), which
 * an automated scanner does not simulate.
 */
function ConfirmEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(false);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const validLink = Boolean(tokenHash && type);

  function handleContinue() {
    if (!tokenHash || !type || verifying) return;
    setVerifying(true);

    fetch(`/api/auth/verify-email?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`)
      .then((res) => res.json())
      .then((body: { status?: VerifyEmailStatus }) => {
        router.replace(`/email-verified?status=${body.status ?? "error"}`);
      })
      .catch(() => {
        router.replace("/email-verified?status=error");
      });
  }

  if (verifying) {
    return (
      <Shell>
        <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-primary" aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-ink">Verifying your email…</h1>
        <p className="mt-2 text-sm text-ink-muted">This will only take a moment.</p>
      </Shell>
    );
  }

  if (!validLink) {
    return (
      <Shell>
        <h1 className="mt-4 text-xl font-bold text-ink">Link expired</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This confirmation link is invalid or has expired. Sign in to request a new one.
        </p>
        <Link href="/login" className="btn-primary mt-5 block w-full text-center">
          Go to sign in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mt-4 text-xl font-bold text-ink">Confirm your email</h1>
      <p className="mt-2 text-sm text-ink-muted">Tap continue to verify your email and finish setting up your account.</p>
      <button type="button" onClick={handleContinue} className="btn-primary mt-5 w-full">
        Continue
      </button>
    </Shell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-primary" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-ink">Loading…</h1>
        </Shell>
      }
    >
      <ConfirmEmail />
    </Suspense>
  );
}
