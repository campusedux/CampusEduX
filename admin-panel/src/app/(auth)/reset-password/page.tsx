'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { updatePasswordAction } from '@/actions/auth';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { Input, Label } from '@/components/ui/primitives';

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(updatePasswordAction, { error: null as string | null });
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && pw !== confirm;

  return (
    <AuthSplit>
      <div>
        <h1 className="text-xl font-bold text-ink">Set a new password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Choose a strong password you don&apos;t use anywhere else.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••••"
            />
            <PasswordStrength value={pw} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              name="confirm"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••••"
            />
            {mismatch ? <p className="mt-1 text-xs text-danger">The two passwords don’t match.</p> : null}
          </div>

          {state.error ? (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
          ) : null}

          <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
        </form>
      </div>
    </AuthSplit>
  );
}
