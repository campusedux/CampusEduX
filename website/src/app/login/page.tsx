"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { safeInternalPath } from "@/lib/nav";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

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
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">Use the same account as the CampusEduX app.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm text-ink">Email or mobile number</label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-ink">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-1 w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        New to CampusEduX? <Link href="/register" className="text-ink underline">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-6 py-16">
          <h1 className="text-3xl font-bold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
