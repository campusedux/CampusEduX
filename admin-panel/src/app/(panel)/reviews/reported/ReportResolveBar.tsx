'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Textarea } from '@/components/ui/primitives';
import { resolveReport } from '../actions';

export function ReportResolveBar({ reportId, reviewId }: { reportId: string; reviewId?: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<null | 'reviewed' | 'keep' | 'remove'>(null);
  const [note, setNote] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const run = (kind: 'reviewed' | 'keep' | 'remove') =>
    start(async () => {
      const res = await resolveReport(
        reportId,
        kind === 'reviewed' ? 'reviewed' : 'resolved',
        note,
        kind === 'keep' ? 'keep' : kind === 'remove' ? 'remove' : undefined,
        kind === 'keep' || kind === 'remove' ? reviewId : undefined,
      );
      if (!res.ok) toast({ title: 'Could not resolve', description: res.error, variant: 'error' });
      else {
        toast({ title: 'Report updated', variant: 'success' });
        setOpen(null);
        setNote('');
        router.refresh();
      }
    });

  const btn = 'inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm font-medium disabled:opacity-50';

  if (open) {
    return (
      <div className="min-w-[220px] space-y-2">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Resolution note (optional)" />
        <div className="flex justify-end gap-1.5">
          <button onClick={() => setOpen(null)} className={`${btn} border border-border text-ink hover:bg-surface-subtle`}>
            Cancel
          </button>
          <button
            onClick={() => run(open)}
            disabled={pending}
            className={`${btn} ${open === 'remove' ? 'bg-danger' : 'bg-success'} text-white hover:opacity-90`}
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : null}
            Confirm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <button onClick={() => run('reviewed')} disabled={pending} className={`${btn} border border-border text-ink hover:bg-surface-subtle`}>
        Mark reviewed
      </button>
      <button onClick={() => setOpen('keep')} disabled={pending} className={`${btn} border border-success/30 text-success hover:bg-success/10`}>
        Keep review
      </button>
      <button onClick={() => setOpen('remove')} disabled={pending} className={`${btn} border border-danger/30 text-danger hover:bg-danger/10`}>
        Remove review
      </button>
    </div>
  );
}
