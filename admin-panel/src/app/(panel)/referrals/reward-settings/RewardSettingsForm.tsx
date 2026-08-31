'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Section, Label, Input, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function RewardSettingsForm({
  action,
  initial,
  canEdit,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial: Record<string, any>;
  canEdit: boolean;
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
      toast({ title: 'Reward settings saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  const Toggle = ({ name, label }: { name: string; label: string }) => (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      <input type="checkbox" name={name} defaultChecked={initial[name]} disabled={!canEdit} className="h-4 w-4 rounded border-border text-brand" />
      {label}
    </label>
  );

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Referral bonus">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="bonus_type">Bonus type</Label>
            <Select id="bonus_type" name="bonus_type" defaultValue={initial.bonus_type ?? 'flat'} disabled={!canEdit}>
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent of order (%)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="bonus_value">Bonus value</Label>
            <Input id="bonus_value" name="bonus_value" type="number" min="0" step="0.01" defaultValue={initial.bonus_value ?? 100} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="min_payout">Min payout (₹)</Label>
            <Input id="min_payout" name="min_payout" type="number" min="0" defaultValue={initial.min_payout ?? 100} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="max_payout">Max payout (₹)</Label>
            <Input id="max_payout" name="max_payout" type="number" min="0" defaultValue={initial.max_payout ?? 5000} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="bonus_validity_days">Bonus validity (days)</Label>
            <Input id="bonus_validity_days" name="bonus_validity_days" type="number" min="0" defaultValue={initial.bonus_validity_days ?? 90} disabled={!canEdit} />
          </div>
        </div>
      </Section>

      <Section title="When to reward">
        <div className="flex flex-col gap-3">
          <Toggle name="reward_on_signup" label="Reward on signup" />
          <Toggle name="reward_on_first_purchase" label="Reward on first purchase" />
          <Toggle name="reward_on_subscription" label="Reward on subscription" />
        </div>
      </Section>

      {canEdit ? (
        <div className="flex justify-end">
          <div className="w-36">
            <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-faint">Read-only for your role.</p>
      )}
    </form>
  );
}
