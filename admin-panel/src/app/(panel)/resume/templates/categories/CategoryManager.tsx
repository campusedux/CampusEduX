'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { createTemplateCategory, updateTemplateCategory, deleteTemplateCategory } from '../../actions';

type Result = { ok: boolean; error?: string };
interface Cat {
  id: string;
  name: string;
  slug: string;
  status: string;
  sort_order: number;
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

export function TemplateCategoryManager({
  categories,
  perms,
}: {
  categories: Cat[];
  perms: { add: boolean; edit: boolean; delete: boolean };
}) {
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Categories (${categories.length})`} />
        {categories.length === 0 ? (
          <EmptyState title="No categories" />
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <Row key={c.id} cat={c} perms={perms} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createTemplateCategory, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add category" />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-end">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" name="slug" />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
        </div>
        <div className="w-24">
          <SubmitButton pendingLabel="…">Add</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function Row({ cat, perms }: { cat: Cat; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateTemplateCategory.bind(null, cat.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <Input name="name" defaultValue={cat.name} disabled={!perms.edit} />
        </div>
        <div className="w-28">
          <Select name="status" defaultValue={cat.status} disabled={!perms.edit}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="w-16">
          <Input name="sort_order" type="number" defaultValue={cat.sort_order} disabled={!perms.edit} />
        </div>
        {perms.edit ? (
          <div className="w-20">
            <SubmitButton pendingLabel="…">Save</SubmitButton>
          </div>
        ) : null}
      </form>
      {perms.delete ? <DeleteButton action={() => deleteTemplateCategory(cat.id)} confirmMessage={`Delete "${cat.name}"?`} /> : null}
    </div>
  );
}
