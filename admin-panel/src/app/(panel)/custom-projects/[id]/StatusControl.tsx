'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Textarea, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { setRequestStatus } from '../actions';
import { CUSTOM_STATUS_LABEL, NEXT_STATUSES, type CustomProjectStatus } from '@/lib/custom-projects/constants';

export function StatusControl({ id, current }: { id: string; current: CustomProjectStatus }) {
  const options = NEXT_STATUSES[current] ?? [];
  const [target, setTarget] = useState<string>(options[0] ?? '');
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  if (options.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        This request is {CUSTOM_STATUS_LABEL[current].toLowerCase()} — no further status changes.
      </p>
    );
  }

  const run = () =>
    start(async () => {
      const res = await setRequestStatus(id, target, note);
      if (!res.ok) {
        toast({ title: 'Could not update status', description: res.error, variant: 'error' });
        return;
      }
      toast({ title: `Status set to ${CUSTOM_STATUS_LABEL[target as CustomProjectStatus]}`, variant: 'success' });
      setNote('');
      router.refresh();
    });

  return (
    <div className="space-y-2">
      <Select value={target} onChange={(e) => setTarget(e.target.value)}>
        {options.map((s) => (
          <option key={s} value={s}>
            {CUSTOM_STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Optional note — recorded in the request history"
      />
      <Button onClick={run} disabled={pending || !target} className="w-full">
        {pending ? <Loader2 size={14} className="animate-spin" /> : null} Update status
      </Button>
    </div>
  );
}
