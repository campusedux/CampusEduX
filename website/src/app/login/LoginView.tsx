"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { emitSessionChange } from "@/lib/sessionSignal";
import { safeInternalPath } from "@/lib/nav";
import { resolvePostLoginDestination } from "./resolvePostLoginDestination";
import { Field, Input } from "@/components/ui";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-2.96.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.05 10.7A5.4 5.4 0 0 1 2.77 9c0-.59.1-1.16.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.07-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.07 2.33C3.76 5.17 5.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const busy = loading || googleLoading;

  useEffect(() => {
    // /auth/callback bounces back here with ?error=oauth on a failed/expired
    // Google exchange (see src/app/auth/callback/route.ts) — surface it once.
    if (searchParams.get("error") === "oauth") {
      setError("Google sign-in didn't go through. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleSignIn() {
    if (busy) return;
    setError(null);
    setGoogleLoading(true);

    const supabase = createBrowserSupabase();
    // Reuses safeInternalPath so the callback route can only ever bounce back
    // to a same-origin path — this "next" travels through the Google
    // redirect round trip as a plain query param.
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", safeInternalPath(searchParams.get("next")));

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });

    if (oauthError) {
      setError(oauthError.message ?? "Could not start Google sign-in.");
      setGoogleLoading(false);
      return;
    }
    // Success leaves googleLoading true — the browser is already navigating
    // to Google, so there's no "done" state to return to on this page.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabase();
    let email = identifier.trim();

    try {
      // Mirrors mobile-app/src/services/auth.service.ts: mobile-number login
      // resolves to an email first via the SECURITY DEFINER RPC, since RLS
      // blocks a direct profiles lookup before a session exists.
      if (!isEmail(email)) {
        const { data: resolvedEmail, error: lookupError } = await supabase.rpc("email_for_mobile", {
          p_mobile: email,
        });
        if (lookupError) throw new Error(lookupError.message);
        if (!resolvedEmail) throw new Error("No account found with this mobile number.");
        email = resolvedEmail as string;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);

      // The session cookie is set now — tell the header islands to re-check
      // `/api/session` so the nav flips to the signed-in state without a reload.
      emitSessionChange();

      const next = safeInternalPath(searchParams.get("next"));
      const destination = signInData.user
        ? await resolvePostLoginDestination(supabase, signInData.user.id, next)
        : next;
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <h1 className="mt-5 text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">Use the same account as the CampusEduX app.</p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        aria-busy={googleLoading}
        className="btn-ghost mt-6 w-full bg-card"
      >
        {googleLoading ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        or
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Email or mobile number" htmlFor="identifier">
          <Input
            id="identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <p className="-mt-2 text-right text-sm">
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        New to CampusEduX?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </Shell>
  );
}

export default function LoginView() {
  return (
    <Suspense
      fallback={
        <Shell>
          <h1 className="mt-5 text-2xl font-bold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Loading…</p>
        </Shell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
