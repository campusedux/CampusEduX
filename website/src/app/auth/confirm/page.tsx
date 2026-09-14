"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { VerifyEmailStatus } from "@/app/api/auth/verify-email/route";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-card sm:p-8">
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

function ConfirmEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode's double-invoked effect in dev — the
    // confirmation token is single-use, so a second call would always fail.
    if (started.current) return;
    started.current = true;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || !type) {
      router.replace("/email-verified?status=error");
      return;
    }

    fetch(`/api/auth/verify-email?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`)
      .then((res) => res.json())
      .then((body: { status?: VerifyEmailStatus }) => {
        router.replace(`/email-verified?status=${body.status ?? "error"}`);
      })
      .catch(() => {
        router.replace("/email-verified?status=error");
      });
  }, [router, searchParams]);

  return (
    <Shell>
      <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-primary" aria-hidden />
      <h1 className="mt-4 text-xl font-bold text-ink">Verifying your email…</h1>
      <p className="mt-2 text-sm text-ink-muted">This will only take a moment.</p>
    </Shell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-primary" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-ink">Verifying your email…</h1>
        </Shell>
      }
    >
      <ConfirmEmail />
    </Suspense>
  );
}
