'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let s = 0;
  if (pw.length >= 10) s += 1;
  if (pw.length >= 14) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s += 1;
  const score = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const label = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  return { score, label };
}

export function PasswordStrength({ value }: { value: string }) {
  const { score, label } = useMemo(() => scorePassword(value), [value]);
  const colors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full', i < score ? colors[score] : 'bg-border')}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        Strength: <span className="font-medium text-ink-muted">{value ? label : '—'}</span> · use 10+ characters with a
        mix of cases, a number and a symbol.
      </p>
    </div>
  );
}
