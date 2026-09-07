'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import type { BlogCategory } from '@/lib/blog/queries';
import { createCategory, updateCategory, deleteCategory } from '../actions';

type Result = { ok: boolean; error?: string };
type Perms = { add: boolean; edit: boolean; delete: boolean };

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

function Fields({ c, disabled }: { c?: BlogCategory; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_90px]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input name="name" required defaultValue={c?.name ?? ''} disabled={disabled} placeholder="Artificial Intelligence" />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            name="slug"
            defaultValue={c?.slug ?? ''}
            disabled={disabled}
            placeholder="auto from name"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort</Label>
          <Input name="sort_order" type="number" defaultValue={c?.sort_order ?? 0} disabled={disabled} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea name="description" rows={2} defaultValue={c?.description ?? ''} disabled={disabled} placeholder="Shown on the category's blog page." />
      </div>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createCategory, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add category" />
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

function Row({ category, perms }: { category: BlogCategory; perms: Perms }) {
  const [state, action] = useFormState(updateCategory.bind(null, category.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <Badge label={`${category.post_count ?? 0} post${category.post_count === 1 ? '' : 's'}`} tone="neutral" />
        {perms.delete ? (
          <DeleteButton
            action={() => deleteCategory(category.id)}
            confirmMessage={`Delete "${category.name}"? Posts using it must be reassigned first.`}
          />
        ) : null}
      </div>
      <form action={action} className="space-y-3">
        <Fields c={category} disabled={!perms.edit} />
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

export function CategoryManager({ categories, perms }: { categories: BlogCategory[]; perms: Perms }) {
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      {categories.length === 0 ? (
        <Card>
          <EmptyState title="No categories yet" description="Add your first category above." />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Categories" description={`${categories.length} total`} />
          <div className="space-y-3">
            {categories.map((c) => (
              <Row key={c.id} category={c} perms={perms} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
