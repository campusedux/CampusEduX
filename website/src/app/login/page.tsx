"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { safeInternalPath } from "@/lib/nav";
import { Field, Input } from "@/components/ui";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <Link href="/" className="flex items-center gap-2" aria-label="CampusEduX home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-base font-black text-white">
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);

      router.push(safeInternalPath(searchParams.get("next")));
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

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
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

export default function LoginPage() {
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
