'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function OrderNotesForm({
  action,
  initial,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Notes saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <form action={formAction} className="space-y-2">
      <Textarea name="admin_notes" rows={3} defaultValue={initial} placeholder="Internal notes about this order" />
      <div className="flex justify-end">
        <div className="w-28">
          <SubmitButton pendingLabel="…">Save</SubmitButton>
        </div>
      </div>
    </form>
  );
}
