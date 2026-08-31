"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";

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
  const [checkEmail, setCheckEmail] = useState(false);

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
        },
      });
      if (signUpError) throw new Error(signUpError.message);

      if (data.session) {
        router.push("/account");
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
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="font-serif text-2xl text-navy">Check your email</h1>
        <p className="mt-3 text-sm text-slate">Confirm your email address to finish creating your account, then sign in.</p>
        <Link href="/login" className="mt-6 inline-block rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-serif text-3xl text-navy">Create an account</h1>
      <p className="mt-2 text-sm text-slate">Same account works in the CampusEduX app.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm text-navy">Full name</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-navy">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-navy">Mobile number</label>
          <input required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-navy">Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
        {referralCode && (
          <p className="text-xs text-emerald">Referral code &quot;{referralCode}&quot; will be applied.</p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-sm bg-navy py-2.5 text-sm text-paper hover:bg-navy/90 disabled:opacity-60">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate">
        Already have an account? <Link href="/login" className="text-navy underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-6 py-16">
          <h1 className="font-serif text-3xl text-navy">Create an account</h1>
          <p className="mt-2 text-sm text-slate">Loading…</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
