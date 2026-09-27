"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { emitSessionChange } from "@/lib/sessionSignal";
import { Field, Input } from "@/components/ui";
import type { VerifyRecoveryStatus } from "@/app/api/auth/verify-recovery/route";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-6 shadow-card sm:p-8">
        <Link href="/" className="flex items-center gap-2" aria-label="CampusEduX home">
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

// "confirm" (a Continue button, shown first) does NOT call verifyOtp — it only
// checks that the URL has a token_hash/type at all. Verification is deferred
// to an explicit click (below) because a recovery token is single-use, and
// email-security gateways (Outlook Safe Links "time-of-click" scanning, some
// corporate mail proxies) fetch/render a link's page before the person ever
// sees it. If that fired verifyOtp automatically on load, the scanner would
// burn the token and every real user would land on "Link expired" — an
// automated scanner does not simulate a button click.
type Status = "confirm" | "checking" | "ready" | "invalid" | "success";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const validLink = Boolean(tokenHash && type === "recovery");

  const [status, setStatus] = useState<Status>(validLink ? "confirm" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  function handleContinue() {
    // Guard against a double-click / StrictMode re-render firing this twice —
    // the recovery token is single-use, so a second call would always fail.
    if (started.current || !tokenHash || !validLink) return;
    started.current = true;
    setStatus("checking");

    fetch(`/api/auth/verify-recovery?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type as string)}`)
      .then((res) => res.json())
      .then((body: { status?: VerifyRecoveryStatus }) => {
        setStatus(body.status === "success" ? "ready" : "invalid");
      })
      .catch(() => {
        setStatus("invalid");
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      // The recovery session was already established server-side by
      // /api/auth/verify-recovery (via Set-Cookie); the browser client picks
      // it up from those cookies to make this call.
      const supabase = createBrowserSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      // End the recovery session so the user signs in fresh with the new
      // password (mirrors mobile-app/src/auth/ResetPasswordScreen.tsx).
      await supabase.auth.signOut();
      emitSessionChange();
      setStatus("success");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "confirm") {
    return (
      <Shell>
        <h1 className="mt-5 text-2xl font-bold text-ink">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Tap continue to verify this link and set a new password.
        </p>
        <button type="button" onClick={handleContinue} className="btn-primary mt-5 w-full">
          Continue
        </button>
      </Shell>
    );
  }

  if (status === "checking") {
    return (
      <Shell>
        <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-primary" aria-hidden />
        <h1 className="mt-4 text-center text-xl font-bold text-ink">Verifying your link…</h1>
        <p className="mt-2 text-center text-sm text-ink-muted">This will only take a moment.</p>
      </Shell>
    );
  }

  if (status === "invalid") {
    return (
      <Shell>
        <h1 className="mt-5 text-2xl font-bold text-ink">Link expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This password reset link is invalid or has expired. Request a new one to continue.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-5 block w-full text-center">
          Request a new link
        </Link>
      </Shell>
    );
  }

  if (status === "success") {
    return (
      <Shell>
        <h1 className="mt-5 text-2xl font-bold text-ink">Password updated</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your password has been changed. Sign in with your new password.
        </p>
        <Link href="/login" className="btn-primary mt-5 block w-full text-center">
          Go to sign in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mt-5 text-2xl font-bold text-ink">Set a new password</h1>
      <p className="mt-1 text-sm text-ink-muted">Choose a new password for your account.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field label="New password" htmlFor="password" hint="At least 6 characters.">
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Saving…" : "Save new password"}
        </button>
      </form>
    </Shell>
  );
}

export default function ResetPasswordView() {
  return (
    <Suspense
      fallback={
        <Shell>
          <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-primary" aria-hidden />
          <h1 className="mt-4 text-center text-xl font-bold text-ink">Loading…</h1>
        </Shell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
