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
 * Bug 3: the admin's control for overriding the estimate. Blocked entirely
 * once the balance is fully paid — the RPC (migration 0124) is the real
 * enforcement point (below-amount-paid / locked / open-checkout), this is
 * just the read-only fallback so a locked request doesn't show a live form.
 */
export function FinalPriceForm({
  requestId,
  estimatedTotal,
  finalPrice,
  amountPaid,
}: {
  requestId: string;
  estimatedTotal: number;
  finalPrice: number | null;
  amountPaid: number;
}) {
  const locked = amountPaid >= (finalPrice ?? estimatedTotal);
  const [state, formAction] = useFormState(setFinalPrice.bind(null, requestId), { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not set final price', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Final price updated', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  const [value, setValue] = useState(String(finalPrice ?? ''));

  if (locked) {
    return (
      <p className="text-xs text-ink-faint">
        The balance is fully paid, so the price is locked at {finalPrice != null ? `₹${finalPrice}` : 'the estimate'}.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <div>
        <Label htmlFor="final_price">Final price (₹)</Label>
        <Input
          id="final_price"
          name="final_price"
          type="number"
          min={amountPaid}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={String(estimatedTotal)}
        />
        <p className="mt-1 text-xs text-ink-faint">
          Cannot be below the amount already paid (₹{amountPaid}). Overrides the estimated total everywhere the
          student sees a price.
        </p>
      </div>
      <div>
        <Label htmlFor="note">Note (optional, recorded in history)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="e.g. agreed after adding two extra features" />
      </div>
      <SubmitButton pendingLabel="Saving…">Set final price</SubmitButton>
    </form>
  );
}
