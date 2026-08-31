'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { sendResetLinkAction } from '@/actions/auth';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { Input, Label } from '@/components/ui/primitives';

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(sendResetLinkAction, { error: null as string | null });

  return (
    <AuthSplit>
      <div>
        <h1 className="text-xl font-bold text-ink">Forgot your password?</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your admin email and we&apos;ll send a 6-digit code and a reset link.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Admin email</Label>
            <Input id="email" type="email" name="email" required autoComplete="email" placeholder="you@campusedux.app" />
          </div>

          {state.error ? (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
          ) : null}
          {state.ok ? (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{state.message}</p>
          ) : null}

          <SubmitButton pendingLabel="Sending…">Send Reset Link</SubmitButton>
        </form>

        {state.ok ? (
          <Link
            href={`/verify-otp`}
            className="mt-4 block text-center text-sm font-medium text-brand hover:underline"
          >
            I have a code — continue
          </Link>
        ) : null}

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
