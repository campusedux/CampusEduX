'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Label, Input, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { setFinalPrice } from '../actions';

type Result = { ok: boolean; error?: string };

/**
 * The admin's control for the BASE project value (accepted add-ons are added on top by the DB).
 * `locked` / `minBase` come from custom_project_amounts(); the RPC (migration 0124 → 0128) is the real
 * enforcement point (below-amount-paid / locked / open-checkout), this only avoids showing a live form
 * that would be refused.
 */
export function FinalPriceForm({
  requestId,
  estimatedTotal,
  finalPrice,
  locked,
  minBase,
}: {
  requestId: string;
  estimatedTotal: number;
  finalPrice: number | null;
  locked: boolean;
  minBase: number;
}) {
  const [state, formAction] = useFormState(setFinalPrice.bind(null, requestId), { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not set the base value', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Base value updated — the student was notified', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  const [value, setValue] = useState(String(finalPrice ?? ''));

  if (locked) {
    return (
      <p className="text-xs text-ink-faint">
        Fully paid, so the base value is locked at {finalPrice != null ? `₹${finalPrice}` : 'the estimate'}.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <div>
        <Label htmlFor="final_price">Base project value (₹)</Label>
        <Input
          id="final_price"
          name="final_price"
          type="number"
          min={minBase}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={String(estimatedTotal)}
        />
        <p className="mt-1 text-xs text-ink-faint">
          Replaces the estimated total. Accepted add-ons are added on top. With accepted add-ons, cannot go below
          ₹{minBase} (the amount already paid).
        </p>
      </div>
      <div>
        <Label htmlFor="note">Note (optional, recorded in history)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="e.g. agreed after adding two extra features" />
      </div>
      <SubmitButton pendingLabel="Saving…">Set base value</SubmitButton>
    </form>
  );
}
