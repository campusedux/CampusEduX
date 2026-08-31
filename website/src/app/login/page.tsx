"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";

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

      router.push(searchParams.get("next") || "/account");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-serif text-3xl text-navy">Sign in</h1>
      <p className="mt-2 text-sm text-slate">Use the same account as the CampusEduX app.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm text-navy">Email or mobile number</label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-navy">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-navy py-2.5 text-sm text-paper hover:bg-navy/90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate">
        New to CampusEduX? <Link href="/register" className="text-navy underline">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-6 py-16">
          <h1 className="font-serif text-3xl text-navy">Sign in</h1>
          <p className="mt-2 text-sm text-slate">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
