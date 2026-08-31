'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { Label, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function BlockForm({
  action,
  blocked,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  blocked: boolean;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) toast({ title: 'Could not update', description: state.error, variant: 'error' });
  }, [state, toast]);

  if (blocked) {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="action" value="unblock" />
        <p className="text-sm text-ink-muted">
          This student is currently <span className="font-medium text-danger">blocked</span>. Unblocking restores full
          access to the app immediately.
        </p>
        <div className="flex justify-end">
          <div className="w-40">
            <SubmitButton pendingLabel="Unblocking…">Unblock student</SubmitButton>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="action" value="block" />
      <div>
        <Label htmlFor="reason">Reason (required)</Label>
        <Textarea id="reason" name="reason" rows={2} required placeholder="e.g. Payment fraud, abusive reviews…" />
      </div>
      <div>
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Context for other staff (optional)" />
      </div>
      <div className="flex justify-end">
        <div className="w-36">
          <SubmitButton className="bg-danger hover:bg-danger/90" pendingLabel="Blocking…">
            Block student
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
