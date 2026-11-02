'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { updatePricingRow, updatePlatformCharge } from '../actions';

type Result = { ok: boolean; error?: string };

function useSavedToast(state: Result) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Pricing updated', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);
}

export function BasePriceRow({
  row,
}: {
  row: { project_type: string; project_level: string; base_price: number; token_amount: number; pricing_version: number; is_active: boolean };
}) {
  const [state, formAction] = useFormState(
    updatePricingRow.bind(null, row.project_type, row.project_level),
    { ok: false },
  );
  useSavedToast(state);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-border py-3 last:border-0">
      <div className="w-40">
        <p className="text-sm font-medium text-ink">
          {row.project_type[0].toUpperCase() + row.project_type.slice(1)} · {row.project_level}
        </p>
      </div>
      <label className="text-xs text-ink-muted">
        Base price (₹)
        <Input name="base_price" type="number" min="0" step="1" defaultValue={row.base_price} className="mt-1 w-32" />
      </label>
      <label className="text-xs text-ink-muted">
        Token (₹)
        <Input key={row.token_amount} name="token_amount" type="number" min="0" step="1" defaultValue={row.token_amount} className="mt-1 w-28" />
      </label>
      <label className="text-xs text-ink-muted">
        Pricing version
        <Input name="pricing_version" type="number" min="1" step="1" defaultValue={row.pricing_version} className="mt-1 w-24" />
      </label>
      <label className="flex items-center gap-1.5 pb-2 text-xs text-ink-muted">
        <input type="checkbox" name="is_active" defaultChecked={row.is_active} className="h-4 w-4 rounded border-border text-brand" />
        Active
      </label>
      <div className="w-24">
        <SubmitButton pendingLabel="…" className="h-9">
          Save
        </SubmitButton>
      </div>
    </form>
  );
}

export function PlatformChargeRow({
  row,
}: {
  row: { platform: string; label: string; charge: number; is_active: boolean };
}) {
  const [state, formAction] = useFormState(updatePlatformCharge.bind(null, row.platform), { ok: false });
  useSavedToast(state);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-border py-3 last:border-0">
      <div className="w-44">
        <p className="text-sm font-medium text-ink">{row.label || row.platform}</p>
      </div>
      <label className="text-xs text-ink-muted">
        Charge (₹)
        <Input name="charge" type="number" min="0" step="1" defaultValue={row.charge} className="mt-1 w-32" />
      </label>
      <label className="flex items-center gap-1.5 pb-2 text-xs text-ink-muted">
        <input type="checkbox" name="is_active" defaultChecked={row.is_active} className="h-4 w-4 rounded border-border text-brand" />
        Active
      </label>
      <div className="w-24">
        <SubmitButton pendingLabel="…" className="h-9">
          Save
        </SubmitButton>
      </div>
    </form>
  );
}
