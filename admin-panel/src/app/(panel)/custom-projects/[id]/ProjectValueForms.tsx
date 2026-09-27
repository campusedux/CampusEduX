'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { CREDIT_KINDS, CREDIT_KIND_LABEL, EDITABLE_REQUEST_FIELDS } from '@/lib/custom-projects/constants';
import { addCredit, adminUpdateRequest, rejectAddon, removeCredit, setAddonPrice } from '../actions';

type Result = { ok: boolean; error?: string };

function useResultToast(state: Result, success: string, failure: string, onOk?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: failure, description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: success, variant: 'success' });
      onOk?.();
      router.refresh();
    }
  }, [state, toast, router, success, failure, onOk]);
}

/** Admin edit of the request details (any status). The base value has its own form (FinalPriceForm). */
export function RequestEditForm({
  requestId,
  initial,
}: {
  requestId: string;
  initial: Record<string, string> & { deadline: string; custom_requirements: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(adminUpdateRequest.bind(null, requestId), { ok: false });
  useResultToast(state, 'Request updated — the student was notified', 'Could not update the request', () => setOpen(false));

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Edit request
      </Button>
    );
  }
  return (
    <form action={formAction} className="space-y-3">
      {EDITABLE_REQUEST_FIELDS.map((f) => (
        <div key={f.key}>
          <Label htmlFor={`adm-${f.key}`}>{f.label}</Label>
          {f.rows ? (
            <Textarea id={`adm-${f.key}`} name={f.key} rows={f.rows} maxLength={f.max} defaultValue={initial[f.key] ?? ''} />
          ) : (
            <Input id={`adm-${f.key}`} name={f.key} maxLength={f.max} defaultValue={initial[f.key] ?? ''} required={f.key === 'title'} />
          )}
        </div>
      ))}
      <div>
        <Label htmlFor="adm-reqs">Requirements (one per line)</Label>
        <Textarea id="adm-reqs" name="custom_requirements" rows={4} defaultValue={initial.custom_requirements} />
      </div>
      <div>
        <Label htmlFor="adm-deadline">Deadline</Label>
        <Input id="adm-deadline" name="deadline" type="date" defaultValue={initial.deadline} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving…" className="w-auto">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}

export function AddonPriceForm({
  addonId,
  requestId,
  price,
  label,
}: {
  addonId: string;
  requestId: string;
  price: number | null;
  label: string;
}) {
  const [state, formAction] = useFormState(setAddonPrice.bind(null, addonId, requestId), { ok: false });
  useResultToast(state, 'Add-on priced — the student was notified', 'Could not price the add-on');
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <Label htmlFor={`price-${addonId}`}>Price (₹)</Label>
        <Input id={`price-${addonId}`} name="price" type="number" min={0} step="0.01" defaultValue={price ?? ''} required className="w-32" />
      </div>
      <div className="min-w-[10rem] flex-1">
        <Label htmlFor={`note-${addonId}`}>Note (optional)</Label>
        <Input id={`note-${addonId}`} name="note" maxLength={500} />
      </div>
      <SubmitButton pendingLabel="Saving…" className="w-auto">
        {label}
      </SubmitButton>
    </form>
  );
}

export function AddonRejectButton({ addonId, requestId }: { addonId: string; requestId: string }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        const note = window.prompt('Reject this add-on? Optional note for the student:');
        if (note === null) return;
        start(async () => {
          const res = await rejectAddon(addonId, requestId, note.trim());
          if (!res.ok) toast({ title: 'Could not reject', description: res.error, variant: 'error' });
          else {
            toast({ title: 'Add-on rejected — the student was notified', variant: 'success' });
            router.refresh();
          }
        });
      }}
    >
      Reject
    </Button>
  );
}

export function CreditForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useFormState(addCredit.bind(null, requestId), { ok: false });
  const formRef = useRef<HTMLFormElement | null>(null);
  useResultToast(state, 'Credit added — the student was notified', 'Could not add the credit', () => formRef.current?.reset());
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="credit-amount">Amount (₹)</Label>
          <Input id="credit-amount" name="amount" type="number" min={0.01} step="0.01" required />
        </div>
        <div>
          <Label htmlFor="credit-kind">Type</Label>
          <Select id="credit-kind" name="kind" defaultValue="offline_payment">
            {CREDIT_KINDS.map((k) => (
              <option key={k} value={k}>
                {CREDIT_KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="credit-note">Note (e.g. UPI reference)</Label>
        <Input id="credit-note" name="note" maxLength={1000} />
      </div>
      <SubmitButton pendingLabel="Saving…">Add credit</SubmitButton>
    </form>
  );
}

export function RemoveCreditButton({ creditId, requestId }: { creditId: string; requestId: string }) {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm('Remove this credit? The due will increase again.')) return;
        start(async () => {
          const res = await removeCredit(creditId, requestId);
          if (!res.ok) toast({ title: 'Could not remove', description: res.error, variant: 'error' });
          else router.refresh();
        });
      }}
    >
      Remove
    </Button>
  );
}
