'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Textarea } from '@/components/ui/primitives';
import { setApplicationStatus } from '../../actions';

type Status = 'in_review' | 'shortlisted' | 'rejected' | 'hired';

export function DecisionBar({ id, current }: { id: string; current: Status }) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const run = (status: Status, r?: string) =>
    start(async () => {
      const res = await setApplicationStatus(id, status, r);
      if (!res.ok) toast({ title: 'Could not update', description: res.error, variant: 'error' });
      else {
        toast({ title: `Marked ${status.replace('_', ' ')}`, variant: 'success' });
        setRejecting(false);
        setReason('');
        router.refresh();
      }
    });

  const btn = 'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium disabled:opacity-50';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => run('shortlisted')}
          disabled={pending || current === 'shortlisted'}
          className={`${btn} bg-info text-white hover:opacity-90`}
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Shortlist
        </button>
        <button
          onClick={() => setRejecting((v) => !v)}
          disabled={pending}
          className={`${btn} border border-danger/30 text-danger hover:bg-danger/10`}
        >
          <X size={14} /> Reject
        </button>
        <button
          onClick={() => run('hired')}
          disabled={pending || current === 'hired'}
          className={`${btn} bg-success text-white hover:opacity-90`}
        >
          <Trophy size={14} /> Mark hired
        </button>
        {current !== 'in_review' ? (
          <button onClick={() => run('in_review')} disabled={pending} className={`${btn} border border-border text-ink hover:bg-surface-subtle`}>
            <RotateCcw size={14} /> Reset to New
          </button>
        ) : null}
      </div>

      {rejecting ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Reason for rejection (shown to no one but the team)"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setRejecting(false)} className={`${btn} border border-border text-ink hover:bg-surface-subtle`}>
              Cancel
            </button>
            <button
              onClick={() => run('rejected', reason)}
              disabled={pending || !reason.trim()}
              className={`${btn} bg-danger text-white hover:opacity-90`}
            >
              Confirm reject
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
