'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { createOffer, updateOffer, deleteOffer } from '../actions';

type Result = { ok: boolean; error?: string };
interface Offer {
  id: string;
  title: string;
  description: string;
  discount_label: string;
  coupon_code: string | null;
  priority: number;
  valid_till: string | null;
  status: string;
}

const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

function useSaveToast(state: Result, reset?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      reset?.();
      router.refresh();
    }
  }, [state, toast, router, reset]);
}

export function OfferManager({ offers, perms }: { offers: Offer[]; perms: { add: boolean; edit: boolean; delete: boolean } }) {
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Offers (${offers.length})`} />
        {offers.length === 0 ? (
          <EmptyState title="No offers" />
        ) : (
          <div className="space-y-2">
            {offers.map((o) => (
              <Row key={o.id} offer={o} perms={perms} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createOffer, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add offer" />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="discount_label">Discount label</Label>
          <Input id="discount_label" name="discount_label" placeholder="Up to 40% off" />
        </div>
        <div>
          <Label htmlFor="coupon_code">Coupon code (optional)</Label>
          <Input id="coupon_code" name="coupon_code" className="uppercase" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input id="priority" name="priority" type="number" defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="valid_till">Valid till</Label>
            <Input id="valid_till" name="valid_till" type="datetime-local" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <div className="w-24">
          <SubmitButton pendingLabel="…">Add</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function Row({ offer, perms }: { offer: Offer; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateOffer.bind(null, offer.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <form action={action} className="grid gap-2 sm:grid-cols-2">
        <div>
          <Input name="title" defaultValue={offer.title} disabled={!perms.edit} />
        </div>
        <div>
          <Input name="discount_label" defaultValue={offer.discount_label} disabled={!perms.edit} />
        </div>
        <div>
          <Input name="coupon_code" defaultValue={offer.coupon_code ?? ''} disabled={!perms.edit} className="uppercase" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input name="priority" type="number" defaultValue={offer.priority} disabled={!perms.edit} />
          <Input name="valid_till" type="datetime-local" defaultValue={toLocal(offer.valid_till)} disabled={!perms.edit} className="col-span-2" />
        </div>
        <div className="sm:col-span-2">
          <Textarea name="description" rows={2} defaultValue={offer.description} disabled={!perms.edit} />
        </div>
        <div className="sm:col-span-2">
          <Select name="status" defaultValue={offer.status} disabled={!perms.edit} className="w-32">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </Select>
        </div>
        <div className="flex items-center justify-between sm:col-span-2">
          <Badge label={offer.status} tone={offer.status === 'active' ? 'success' : 'neutral'} />
          <div className="flex items-center gap-2">
            {perms.edit ? (
              <div className="w-20">
                <SubmitButton pendingLabel="…">Save</SubmitButton>
              </div>
            ) : null}
            {perms.delete ? <DeleteButton action={() => deleteOffer(offer.id)} confirmMessage={`Delete "${offer.title}"?`} /> : null}
          </div>
        </div>
      </form>
    </div>
  );
}
