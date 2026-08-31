'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type Result = { ok: boolean; error?: string };

/**
 * Optimistic on/off switch backed by a bound Server Action
 * `(next: boolean) => Promise<Result>`. Reverts + toasts on failure.
 */
export function ToggleSwitch({
  checked,
  action,
  labelOn,
  labelOff,
  disabled,
}: {
  checked: boolean;
  action: (next: boolean) => Promise<Result>;
  labelOn?: string;
  labelOff?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(checked);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  // Keep in sync if the server value changes after a refresh.
  useEffect(() => setValue(checked), [checked]);

  const flip = () => {
    const next = !value;
    setValue(next); // optimistic
    start(async () => {
      const res = await action(next);
      if (!res?.ok) {
        setValue(!next); // revert
        toast({ title: 'Update failed', description: res?.error, variant: 'error' });
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={flip}
      disabled={disabled || pending}
      className="inline-flex items-center gap-2 disabled:opacity-50"
    >
      <span className={cn('relative h-5 w-9 rounded-full transition-colors', value ? 'bg-brand' : 'bg-border')}>
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </span>
      {labelOn || labelOff ? <span className="text-sm text-ink-muted">{value ? labelOn : labelOff}</span> : null}
    </button>
  );
}
