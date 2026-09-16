"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { absoluteUrl } from "@/lib/seo";
import { Field, Input } from "@/components/ui";

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

export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: absoluteUrl("/reset-password"),
      });
      // Never reveal whether the address has an account — same success
      // message either way (mirrors admin-panel/src/actions/auth.ts).
      if (resetError) console.error("[forgot-password] resetPasswordForEmail", resetError.message);
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Shell>
        <h1 className="mt-5 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          If an account exists for <span className="font-medium text-ink">{email.trim()}</span>, we&apos;ve sent a
          link to reset your password. It expires soon, so use it right away.
        </p>
        <Link href="/login" className="btn-ghost mt-5 w-full">
          Back to sign in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mt-5 text-2xl font-bold text-ink">Forgot password?</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter your email and we&apos;ll send you a reset link.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}
