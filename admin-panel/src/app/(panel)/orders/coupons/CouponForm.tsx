'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

export function CouponForm({
  mode,
  action,
  initial = {},
  cancelHref,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: Record<string, any>;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Coupon">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" required defaultValue={initial.code ?? ''} placeholder="WELCOME20" className="uppercase" />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={initial.status ?? 'active'}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="discount_type">Discount type</Label>
            <Select id="discount_type" name="discount_type" defaultValue={initial.discount_type ?? 'percent'}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="discount_value">Discount value</Label>
            <Input id="discount_value" name="discount_value" type="number" min="0" step="0.01" defaultValue={initial.discount_value ?? 0} />
          </div>
          <div>
            <Label htmlFor="max_discount">Max discount (₹, for %)</Label>
            <Input id="max_discount" name="max_discount" type="number" min="0" step="0.01" defaultValue={initial.max_discount ?? ''} />
          </div>
          <div>
            <Label htmlFor="min_order">Min order (₹)</Label>
            <Input id="min_order" name="min_order" type="number" min="0" step="0.01" defaultValue={initial.min_order ?? 0} />
          </div>
          <div>
            <Label htmlFor="usage_limit">Usage limit (blank = unlimited)</Label>
            <Input id="usage_limit" name="usage_limit" type="number" min="0" defaultValue={initial.usage_limit ?? ''} />
          </div>
          <div />
          <div>
            <Label htmlFor="valid_from">Valid from</Label>
            <Input id="valid_from" name="valid_from" type="datetime-local" defaultValue={toLocal(initial.valid_from)} />
          </div>
          <div>
            <Label htmlFor="valid_till">Valid till</Label>
            <Input id="valid_till" name="valid_till" type="datetime-local" defaultValue={toLocal(initial.valid_till)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={initial.description ?? ''} />
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
        >
          Cancel
        </Link>
        <div className="w-36">
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create coupon' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
