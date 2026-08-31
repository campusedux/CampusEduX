'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Label, Input, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function WalletAdjustForm({ action }: { action: (prev: Result, fd: FormData) => Promise<Result> }) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Adjustment failed', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Wallet updated', variant: 'success' });
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-[120px_1fr_1.5fr_auto] sm:items-end">
      <div>
        <Label htmlFor="mode">Action</Label>
        <Select id="mode" name="mode" defaultValue="credit">
          <option value="credit">Add</option>
          <option value="debit">Deduct</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input id="amount" name="amount" type="number" min="1" step="0.01" required />
      </div>
      <div>
        <Label htmlFor="description">Note</Label>
        <Input id="description" name="description" placeholder="Reason for adjustment" />
      </div>
      <div className="w-28">
        <SubmitButton pendingLabel="…">Apply</SubmitButton>
      </div>
    </form>
  );
}
