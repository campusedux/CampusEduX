'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Select } from '@/components/ui/primitives';
import { setReviewStatus, deleteReviewWithReason } from './actions';

const STATUSES = ['published', 'pending', 'reported', 'removed'] as const;

export function ReviewStatusSelect({ id, current }: { id: string; current: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Select
      defaultValue={current}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          const res = await setReviewStatus(id, e.target.value as (typeof STATUSES)[number]);
          if (!res.ok) toast({ title: 'Could not update', description: res.error, variant: 'error' });
          else router.refresh();
        })
      }
      className="h-8 w-32 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}

export function DeleteReviewButton({ id, label }: { id: string; label?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const run = () => {
    const reason = window.prompt('Reason for deleting this review (shown in the activity log):', '');
    if (reason === null) return;
    start(async () => {
      const res = await deleteReviewWithReason(id, reason || 'No reason given');
      if (!res.ok) toast({ title: 'Delete failed', description: res.error, variant: 'error' });
      else {
        toast({ title: 'Review deleted', variant: 'success' });
        router.refresh();
      }
    });
  };

  if (label) {
    return (
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger/30 px-3 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
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
      aria-label="Delete review"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger disabled:opacity-40"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}
