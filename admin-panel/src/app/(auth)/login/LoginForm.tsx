'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { signInAction } from '@/actions/auth';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { Input, Label } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export function LoginForm({
  notice,
  noticeTone = 'error',
}: {
  notice: string | null;
  noticeTone?: 'error' | 'success';
}) {
  const [state, formAction] = useFormState(signInAction, { error: null as string | null });
  const message = state.error ?? notice;
  const tone = state.error ? 'error' : noticeTone;

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Sign in to the Admin Panel</h1>
      <p className="mt-1 text-sm text-ink-muted">Use your staff credentials to continue.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" name="email" required autoComplete="email" placeholder="you@campusedux.app" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded border-border text-brand" />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-brand hover:underline">
            Forgot Password?
          </Link>
        </div>

        {message ? (
          <p
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              tone === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            {message}
          </p>
        ) : null}

        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>

      <p className="mt-8 hidden text-center text-xs text-ink-faint lg:block">Secure Admin Access</p>
    </div>
  );
}
