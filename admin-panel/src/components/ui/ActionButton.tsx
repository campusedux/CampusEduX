'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type Result = { ok: boolean; error?: string };

/**
 * Runs a bound Server Action `() => Promise<Result>` with a pending spinner,
 * error toast and `router.refresh()` on success. For small inline actions
 * (set-latest, approve, reject, resend…) that don't need a form.
 */
export function ActionButton({
  action,
  children,
  variant = 'secondary',
  confirmMessage,
  successToast,
  className,
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  confirmMessage?: string;
  successToast?: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const run = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    start(async () => {
      const res = await action();
      if (!res?.ok) {
        toast({ title: 'Action failed', description: res?.error, variant: 'error' });
        return;
      }
      if (successToast) toast({ title: successToast, variant: 'success' });
      router.refresh();
    });
  };

  const styles: Record<string, string> = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'border border-border bg-white text-ink hover:bg-surface-subtle',
    ghost: 'text-ink-muted hover:bg-surface-subtle',
    danger: 'border border-danger/30 text-danger hover:bg-danger/10',
  };

  return (
    <button
      onClick={run}
      disabled={pending}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50',
        styles[variant],
        className,
      )}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
