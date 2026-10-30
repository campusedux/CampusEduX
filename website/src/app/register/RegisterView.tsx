"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { emitSessionChange } from "@/lib/sessionSignal";
import { Field, Input } from "@/components/ui";
import { CURRENT_LEGAL_VERSION, LEGAL_VERSIONS } from "@/legal/config";
import { absoluteUrl } from "@/lib/seo";
import { safeInternalPath } from "@/lib/nav";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-8 sm:px-6 md:py-10">
      <div className="rounded-xl border border-line bg-card p-4 shadow-card md:p-5">
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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode] = useState(searchParams.get("ref") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const busy = loading || googleLoading;

  async function handleGoogleSignIn() {
    if (busy) return;
    setError(null);
    setGoogleLoading(true);

    try {
      const supabase = createBrowserSupabase();
      // Same pattern as LoginView.handleGoogleSignIn — the referral code rides
      // along as a plain query param on the callback URL (Google round-trips it
      // unchanged) so /auth/callback can apply it once the session exists,
      // since signInWithOAuth has no raw_user_meta_data-style channel the way
      // signUp's options.data does.
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", safeInternalPath(searchParams.get("next")));
      if (referralCode) redirectTo.searchParams.set("ref", referralCode);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });

      if (oauthError) {
        setError(oauthError.message ?? "Could not start Google sign-in.");
        setGoogleLoading(false);
        return;
      }
      // Success leaves googleLoading true — the browser is already navigating away.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabase();
    try {
      // handle_new_user() (mobile-app migrations/0001_profiles.sql) reads
      // full_name / mobile_number / referral_code straight out of
      // raw_user_meta_data and creates the profiles row automatically —
      // nothing else needs to be inserted client-side.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            mobile_number: mobileNumber.trim(),
            referral_code: referralCode || undefined,
          },
          // Where the branded confirmation email's "Verify My Email" link
          // sends the browser — see src/app/auth/confirm/page.tsx.
          emailRedirectTo: absoluteUrl("/auth/confirm"),
        },
      });
      if (signUpError) throw new Error(signUpError.message);

      if (data.session) {
        // Record acceptance of the policies shown below the form, the same way
        // the mobile app does (migration 0039). Best-effort — never block signup.
        void supabase
          .rpc("record_legal_consent", {
            p_legal_version: CURRENT_LEGAL_VERSION,
            p_privacy_version: LEGAL_VERSIONS["privacy-policy"].version,
            p_terms_version: LEGAL_VERSIONS.terms.version,
            p_source: "website_register",
          })
          .then(undefined, () => undefined);
        // Session cookie is set — flip the header nav to signed-in without a reload.
        emitSessionChange();
        router.push(searchParams.get("next") ? safeInternalPath(searchParams.get("next")) : "/account");
        router.refresh();
      } else {
        setCheckEmail(true);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <Shell>
        <h1 className="mt-5 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Confirm your email address to finish creating your account, then sign in.
        </p>
        <Link href="/login" className="btn-ghost mt-5 w-full">
          Go to sign in
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="mt-5 text-2xl font-bold text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-ink-muted">Same account works in the CampusEduX app.</p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        aria-busy={googleLoading}
        className="btn-ghost mt-6 w-full bg-card"
      >
        {googleLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        or
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Full name" htmlFor="fullName">
          <Input
            id="fullName"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
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
        <Field label="Mobile number" htmlFor="mobileNumber">
          <Input
            id="mobileNumber"
            required
            inputMode="tel"
            autoComplete="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 6 characters.">
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
        {referralCode && (
          <p className="text-xs text-success">Referral code &quot;{referralCode}&quot; will be applied.</p>
        )}
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}
        <p className="text-xs leading-relaxed text-ink-muted">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline" target="_blank">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="font-medium text-primary hover:underline" target="_blank">
            Privacy Policy
          </Link>
          .
        </p>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

export default function RegisterView() {
  return (
    <Suspense
      fallback={
        <Shell>
          <h1 className="mt-5 text-2xl font-bold text-ink">Create an account</h1>
          <p className="mt-1 text-sm text-ink-muted">Loading…</p>
        </Shell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
