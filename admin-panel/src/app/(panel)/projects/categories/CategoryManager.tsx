'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { createCategory, updateCategory, deleteCategory } from './actions';

type Result = { ok: boolean; error?: string };
interface Cat {
  id: string;
  name: string;
  icon: string;
  project_count: number;
  sort_order: number;
}

export function CategoryManager({ categories, canAdd, canEdit, canDelete }: {
  categories: Cat[];
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="space-y-5">
      {canAdd ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Categories (${categories.length})`} />
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <RowForm key={c.id} cat={c} canEdit={canEdit} canDelete={canDelete} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createCategory, { ok: false } as Result);
  const { toast } = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not add', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Category added', variant: 'success' });
      ref.current?.reset();
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader title="Add category" />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-end">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Web Development" />
        </div>
        <div>
          <Label htmlFor="icon">Icon</Label>
          <Input id="icon" name="icon" placeholder="folder-outline" />
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

function RowForm({ cat, canEdit, canDelete }: { cat: Cat; canEdit: boolean; canDelete: boolean }) {
  const [state, action] = useFormState(updateCategory.bind(null, cat.id), { ok: false } as Result);
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <Input name="name" defaultValue={cat.name} disabled={!canEdit} />
        </div>
        <div className="w-40">
          <Input name="icon" defaultValue={cat.icon} disabled={!canEdit} />
        </div>
        <div className="w-20">
          <Input name="sort_order" type="number" defaultValue={cat.sort_order} disabled={!canEdit} />
        </div>
        <span className="pb-2 text-xs text-ink-faint">{cat.project_count} projects</span>
        {canEdit ? (
          <div className="w-20">
            <SubmitButton pendingLabel="…">Save</SubmitButton>
          </div>
        ) : null}
      </form>
      {canDelete ? (
        <DeleteButton action={() => deleteCategory(cat.id)} confirmMessage={`Delete "${cat.name}"?`} />
      ) : null}
    </div>
  );
}
