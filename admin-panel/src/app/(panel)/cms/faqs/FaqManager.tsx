'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { FAQ_CATEGORIES } from '@/lib/cms/constants';
import { createFaq, updateFaq, deleteFaq } from '../actions';

type Result = { ok: boolean; error?: string };
interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  status: string;
}

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

export function FaqManager({ faqs, perms }: { faqs: Faq[]; perms: { add: boolean; edit: boolean; delete: boolean } }) {
  const groups = FAQ_CATEGORIES.map((cat) => ({ cat, items: faqs.filter((f) => f.category === cat) }));
  const other = faqs.filter((f) => !FAQ_CATEGORIES.includes(f.category as any));
  if (other.length) groups.push({ cat: 'Other' as any, items: other });

  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      {faqs.length === 0 ? (
        <Card>
          <EmptyState title="No FAQs yet" />
        </Card>
      ) : (
        groups
          .filter((g) => g.items.length)
          .map((g) => (
            <Card key={g.cat}>
              <CardHeader title={g.cat} description={`${g.items.length} question${g.items.length === 1 ? '' : 's'}`} />
              <div className="space-y-3">
                {g.items.map((f) => (
                  <Row key={f.id} faq={f} perms={perms} />
                ))}
              </div>
            </Card>
          ))
      )}
    </div>
  );
}

function Fields({ f, disabled }: { f?: Faq; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_90px]">
        <div>
          <Label htmlFor="question">Question</Label>
          <Input name="question" required defaultValue={f?.question ?? ''} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={f?.category ?? 'General'} disabled={disabled}>
            {FAQ_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sort_order">Sort</Label>
          <Input name="sort_order" type="number" defaultValue={f?.sort_order ?? 0} disabled={disabled} />
        </div>
      </div>
      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea name="answer" rows={3} defaultValue={f?.answer ?? ''} disabled={disabled} />
      </div>
      <Select name="status" defaultValue={f?.status ?? 'active'} disabled={disabled} className="w-32">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createFaq, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add FAQ" />
      <form ref={ref} action={action} className="space-y-3">
        <Fields />
        <div className="flex justify-end">
          <div className="w-24">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Row({ faq, perms }: { faq: Faq; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateFaq.bind(null, faq.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <Badge label={faq.status} tone={faq.status === 'active' ? 'success' : 'neutral'} />
        {perms.delete ? <DeleteButton action={() => deleteFaq(faq.id)} confirmMessage="Delete this FAQ?" /> : null}
      </div>
      <form action={action} className="space-y-3">
        <Fields f={faq} disabled={!perms.edit} />
        {perms.edit ? (
          <div className="flex justify-end">
            <div className="w-20">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
