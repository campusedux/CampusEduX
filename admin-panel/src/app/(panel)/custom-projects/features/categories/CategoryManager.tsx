'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Textarea, EmptyState, Badge } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useToast } from '@/components/ui/toast';
import {
  createFeatureCategory,
  updateFeatureCategory,
  deleteFeatureCategory,
  toggleFeatureCategoryActive,
} from '../../actions';

type Result = { ok: boolean; error?: string };

interface Cat {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  feature_count: number;
}

export function CategoryManager({
  categories,
  canAdd,
  canEdit,
  canDelete,
}: {
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
  const [state, action] = useFormState(createFeatureCategory, { ok: false } as Result);
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
      <form ref={ref} action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_120px_90px]">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="User Management" />
          </div>
          <div>
            <Label htmlFor="icon">Icon</Label>
            <Input id="icon" name="icon" placeholder="users" />
          </div>
          <div>
            <Label htmlFor="sort_order">Sort</Label>
            <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} placeholder="Optional — what belongs in this category" />
        </div>
        <div className="w-28">
          <SubmitButton pendingLabel="…">Add</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function RowForm({ cat, canEdit, canDelete }: { cat: Cat; canEdit: boolean; canDelete: boolean }) {
  const [state, action] = useFormState(updateFeatureCategory.bind(null, cat.id), { ok: false } as Result);
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
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start gap-2">
        <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[160px] flex-1">
            <span className="mb-1 block text-xs text-ink-faint">Name</span>
            <Input name="name" defaultValue={cat.name} disabled={!canEdit} />
          </div>
          <div className="w-28">
            <span className="mb-1 block text-xs text-ink-faint">Icon</span>
            <Input name="icon" defaultValue={cat.icon ?? ''} disabled={!canEdit} />
          </div>
          <div className="w-20">
            <span className="mb-1 block text-xs text-ink-faint">Sort</span>
            <Input name="sort_order" type="number" defaultValue={cat.sort_order} disabled={!canEdit} />
          </div>
          <div className="min-w-[180px] flex-1">
            <span className="mb-1 block text-xs text-ink-faint">Description</span>
            <Input name="description" defaultValue={cat.description} disabled={!canEdit} />
          </div>
          {canEdit ? (
            <div className="w-20">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          ) : null}
        </form>
        <div className="flex items-center gap-2 pt-5">
          {canEdit ? (
            <ToggleSwitch
              checked={cat.is_active}
              action={toggleFeatureCategoryActive.bind(null, cat.id)}
              labelOn="Active"
              labelOff="Off"
            />
          ) : (
            <Badge label={cat.is_active ? 'Active' : 'Off'} tone={cat.is_active ? 'success' : 'neutral'} />
          )}
          {canDelete ? (
            <DeleteButton
              action={() => deleteFeatureCategory(cat.id)}
              confirmMessage={`Delete "${cat.name}"?`}
            />
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        {cat.feature_count} feature{cat.feature_count === 1 ? '' : 's'} use this category
      </p>
    </div>
  );
}
