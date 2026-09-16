"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
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

type Status = "checking" | "ready" | "invalid" | "success";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode's double-invoked effect in dev — the
    // recovery token is single-use, so a second call would always fail.
    if (started.current) return;
    started.current = true;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    // Only a token_hash freshly verified by our own server for THIS link
    // counts as a genuine recovery session — an unrelated, already-signed-in
    // session in this browser is never treated as one.
    if (!tokenHash || type !== "recovery") {
      setStatus("invalid");
      return;
    }

    fetch(`/api/auth/verify-recovery?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`)
      .then((res) => res.json())
      .then((body: { status?: VerifyRecoveryStatus }) => {
        setStatus(body.status === "success" ? "ready" : "invalid");
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, [searchParams]);

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
