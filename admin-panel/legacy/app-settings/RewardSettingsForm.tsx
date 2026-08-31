'use client';

import { useState, useTransition } from 'react';
import { Label, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { updateRewardSettings } from '@/app/settings/actions';

interface Values {
  isEnabled: boolean;
  rewardType: 'fixed' | 'percentage';
  rewardAmount: number;
  minPurchase: number;
  perUserCap: number | null;
  validityDays: number;
}

export function RewardSettingsForm({ initialValues }: { initialValues: Values }) {
  const [values, setValues] = useState<Values>(initialValues);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateRewardSettings(values);
        setSaved(true);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={values.isEnabled} onChange={(e) => set('isEnabled', e.target.checked)} />
        Referral rewards enabled
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Reward type</Label>
          <Select value={values.rewardType} onChange={(e) => set('rewardType', e.target.value as Values['rewardType'])}>
            <option value="fixed">Fixed amount (₹)</option>
            <option value="percentage">Percentage of order (%)</option>
          </Select>
        </div>
        <div>
          <Label>Reward amount</Label>
          <Input type="number" min={0} value={values.rewardAmount} onChange={(e) => set('rewardAmount', Number(e.target.value))} />
        </div>
        <div>
          <Label>Minimum purchase to qualify (₹)</Label>
          <Input type="number" min={0} value={values.minPurchase} onChange={(e) => set('minPurchase', Number(e.target.value))} />
        </div>
        <div>
          <Label>Per-user cap (₹, optional)</Label>
          <Input
            type="number"
            min={0}
            value={values.perUserCap ?? ''}
            onChange={(e) => set('perUserCap', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Reward validity (days)</Label>
          <Input type="number" min={1} value={values.validityDays} onChange={(e) => set('validityDays', Number(e.target.value))} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved ? <span className="text-sm text-success">Saved</span> : null}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save reward settings'}
        </Button>
      </div>
    </div>
  );
}
