'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFormState } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { verifyOtpAction, resendOtpAction } from '@/actions/auth';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { OtpInput } from '@/components/auth/OtpInput';
import { Input, Label } from '@/components/ui/primitives';

function VerifyOtpInner() {
  const emailParam = useSearchParams().get('email') ?? '';
  const [verifyState, verifyAction] = useFormState(verifyOtpAction, { error: null as string | null });
  const [resendState, resendAction] = useFormState(resendOtpAction, { error: null as string | null });
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (resendState.ok) setSeconds(30);
  }, [resendState.ok]);

  return (
    <AuthSplit>
      <div>
        <h1 className="text-xl font-bold text-ink">Enter verification code</h1>
        <p className="mt-1 text-sm text-ink-muted">
          We sent a 6-digit code to {emailParam ? <span className="font-medium text-ink">{emailParam}</span> : 'your admin email'}.
        </p>

        <form action={verifyAction} className="mt-6 space-y-4">
          {emailParam ? (
            <input type="hidden" name="email" value={emailParam} />
          ) : (
            <div>
              <Label htmlFor="email">Admin email</Label>
              <Input id="email" type="email" name="email" required placeholder="you@campusedux.app" />
            </div>
          )}

          <OtpInput />

          {verifyState.error ? (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{verifyState.error}</p>
          ) : null}

          <SubmitButton pendingLabel="Verifying…">Verify</SubmitButton>
        </form>

        <form action={resendAction} className="mt-4 text-center text-sm">
          {emailParam ? <input type="hidden" name="email" value={emailParam} /> : null}
          {seconds > 0 ? (
            <span className="text-ink-faint">Resend code in 0:{String(seconds).padStart(2, '0')}</span>
          ) : (
            <button type="submit" className="font-medium text-brand hover:underline">
              Resend code
            </button>
          )}
          {resendState.ok ? <p className="mt-1 text-success">{resendState.message}</p> : null}
        </form>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    </AuthSplit>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpInner />
    </Suspense>
  );
}
