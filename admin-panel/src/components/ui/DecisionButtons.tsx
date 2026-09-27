'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Textarea } from '@/components/ui/primitives';

type Result = { ok: boolean; error?: string };

/**
 * Approve / Reject pair backed by a bound Server Action
 * `(decision: 'approve' | 'reject', note: string) => Promise<Result>`.
 * Reject opens a required-note box (also used for the approve note).
 */
export function DecisionButtons({
  action,
  requireRejectNote = true,
  size = 'sm',
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  requireApproveNote = false,
  approveNotePlaceholder = 'Note (optional)',
}: {
  action: (decision: 'approve' | 'reject', note: string) => Promise<Result>;
  requireRejectNote?: boolean;
  size?: 'sm' | 'md';
  approveLabel?: string;
  rejectLabel?: string;
  requireApproveNote?: boolean;
  approveNotePlaceholder?: string;
}) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<null | 'approve' | 'reject'>(null);
  const [note, setNote] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const run = (decision: 'approve' | 'reject') =>
    start(async () => {
      const res = await action(decision, note);
      if (!res.ok) {
        toast({ title: 'Could not process', description: res.error, variant: 'error' });
        return;
      }
      toast({ title: decision === 'approve' ? (approveLabel === 'Approve' ? 'Approved' : 'Done') : 'Rejected', variant: 'success' });
      setMode(null);
      setNote('');
      router.refresh();
    });

  const h = size === 'md' ? 'h-9' : 'h-8';

  if (mode) {
    return (
      <div className="min-w-[220px] space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={mode === 'reject' ? 'Reason (required)' : approveNotePlaceholder}
        />
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => setMode(null)}
            className={`${h} rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle`}
          >
            Cancel
          </button>
          <button
            onClick={() => run(mode)}
            disabled={
              pending ||
              (mode === 'reject' && requireRejectNote && !note.trim()) ||
              (mode === 'approve' && requireApproveNote && !note.trim())
            }
            className={`${h} inline-flex items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white disabled:opacity-50 ${
              mode === 'approve' ? 'bg-success hover:opacity-90' : 'bg-danger hover:opacity-90'
            }`}
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : null}
            Confirm {mode === 'approve' ? approveLabel.toLowerCase() : rejectLabel.toLowerCase()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setMode('approve')}
        disabled={pending}
        className={`${h} inline-flex items-center gap-1 rounded-lg bg-success px-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50`}
      >
        <Check size={14} /> {approveLabel}
      </button>
      <button
        onClick={() => setMode('reject')}
        disabled={pending}
        className={`${h} inline-flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50`}
      >
        <X size={14} /> {rejectLabel}
      </button>
    </div>
  );
}
