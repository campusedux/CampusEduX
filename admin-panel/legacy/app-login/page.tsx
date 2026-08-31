'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { signInAction } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const notStaff = searchParams.get('error') === 'not_staff';
  const [state, formAction] = useFormState(signInAction, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sidebar px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-ink">
            CampusEduX<span className="text-brand">.</span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to the admin panel</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" name="email" required autoComplete="email" placeholder="you@projecthub.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
          </div>

          {state.error || notStaff ? (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {notStaff ? "That account doesn't have admin panel access." : state.error}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
