'use client';

import { useState, useTransition } from 'react';
import { Label, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createCoupon, updateCoupon, type CouponFormValues } from '@/app/coupons/actions';

const DEFAULTS: CouponFormValues = {
  code: '',
  discountType: 'flat',
  value: 0,
  minPurchase: 0,
  maxDiscount: null,
  usageLimit: null,
  perUserLimit: 1,
  validUntil: null,
  isActive: true,
};

export function CouponForm({ couponId, initialValues }: { couponId?: string; initialValues?: Partial<CouponFormValues> }) {
  const [values, setValues] = useState<CouponFormValues>({ ...DEFAULTS, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!values.code.trim()) {
      setError('A coupon code is required.');
      return;
    }
    if (values.value <= 0) {
      setError('Value must be greater than zero.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (couponId) await updateCoupon(couponId, values);
        else await createCoupon(values);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Coupon code</Label>
          <Input
            value={values.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="WELCOME100"
            className="font-mono uppercase"
          />
        </div>

        <div>
          <Label>Discount type</Label>
          <Select value={values.discountType} onChange={(e) => set('discountType', e.target.value as 'flat' | 'percentage')}>
            <option value="flat">Flat amount (₹)</option>
            <option value="percentage">Percentage (%)</option>
          </Select>
        </div>
        <div>
          <Label>Value</Label>
          <Input type="number" min={0} value={values.value} onChange={(e) => set('value', Number(e.target.value))} />
        </div>

        <div>
          <Label>Minimum purchase (₹)</Label>
          <Input
            type="number"
            min={0}
            value={values.minPurchase}
            onChange={(e) => set('minPurchase', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Max discount cap (₹, optional)</Label>
          <Input
            type="number"
            min={0}
            value={values.maxDiscount ?? ''}
            onChange={(e) => set('maxDiscount', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <Label>Total usage limit (optional)</Label>
          <Input
            type="number"
            min={0}
            value={values.usageLimit ?? ''}
            onChange={(e) => set('usageLimit', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Per-user limit</Label>
          <Input
            type="number"
            min={1}
            value={values.perUserLimit}
            onChange={(e) => set('perUserLimit', Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Valid until (optional)</Label>
          <Input
            type="date"
            value={values.validUntil ?? ''}
            onChange={(e) => set('validUntil', e.target.value || null)}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : couponId ? 'Save changes' : 'Create coupon'}
        </Button>
      </div>
    </div>
  );
}
