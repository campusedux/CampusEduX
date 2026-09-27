'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useSiteNotice } from '@/components/learning/useSiteNotice';
import { cn } from '@/lib/utils';

type Result = { ok: boolean; error?: string; warning?: string; retryTags?: string[] };

/**
 * Icon (or labelled) button that runs a bound Server Action behind a
 * confirm(), then refreshes. Error → toast; the row/list re-renders on success.
 */
export function DeleteButton({
  action,
  confirmMessage = 'Delete this item? This cannot be undone.',
  label,
  className,
  redirectTo,
}: {
  action: () => Promise<Result>;
  confirmMessage?: string;
  label?: string;
  className?: string;
  redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const notify = useSiteNotice();

  const run = () => {
    if (!window.confirm(confirmMessage)) return;
    start(async () => {
      const res = await action();
      if (!res?.ok) {
        toast({ title: 'Delete failed', description: res?.error, variant: 'error' });
        return;
      }
      toast({ title: 'Deleted', variant: 'success' });
      notify(res);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  if (label) {
    return (
      <button
        onClick={run}
        disabled={pending}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger/30 px-3 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50',
          className,
        )}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={run}
      disabled={pending}
      aria-label="Delete"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger disabled:opacity-40',
        className,
      )}
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}
