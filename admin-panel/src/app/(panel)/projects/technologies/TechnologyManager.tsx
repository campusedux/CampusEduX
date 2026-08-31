'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { createTechnology, updateTechnology, deleteTechnology } from './actions';

type Result = { ok: boolean; error?: string };
interface Tech {
  id: string;
  name: string;
  slug: string;
  icon: string;
  category: string;
  status: string;
  sort_order: number;
}

const CATS = ['Frontend', 'Backend', 'Mobile', 'Database', 'DevOps', 'Language', 'General'];

export function TechnologyManager({ technologies, canAdd, canEdit, canDelete }: {
  technologies: Tech[];
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="space-y-5">
      {canAdd ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Technologies (${technologies.length})`} />
        {technologies.length === 0 ? (
          <EmptyState title="No technologies yet" description="Apply admin migration 003 to seed the starter list." />
        ) : (
          <div className="space-y-2">
            {technologies.map((t) => (
              <RowForm key={t.id} tech={t} canEdit={canEdit} canDelete={canDelete} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createTechnology, { ok: false } as Result);
  const { toast } = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not add', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Technology added', variant: 'success' });
      ref.current?.reset();
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader title="Add technology" />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="React" />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" name="slug" placeholder="react" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" defaultValue="General">
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="sort_order">Sort</Label>
            <Input id="sort_order" name="sort_order" type="number" defaultValue={0} />
          </div>
          <div className="w-20">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function RowForm({ tech, canEdit, canDelete }: { tech: Tech; canEdit: boolean; canDelete: boolean }) {
  const [state, action] = useFormState(updateTechnology.bind(null, tech.id), { ok: false } as Result);
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
        <div className="min-w-[140px] flex-1">
          <Input name="name" defaultValue={tech.name} disabled={!canEdit} />
        </div>
        <span className="pb-2 text-xs text-ink-faint">/{tech.slug}</span>
        <div className="w-32">
          <Select name="category" defaultValue={tech.category} disabled={!canEdit}>
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="w-28">
          <Select name="status" defaultValue={tech.status} disabled={!canEdit}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="w-16">
          <Input name="sort_order" type="number" defaultValue={tech.sort_order} disabled={!canEdit} />
        </div>
        <input type="hidden" name="icon" defaultValue={tech.icon} />
        {canEdit ? (
          <div className="w-20">
            <SubmitButton pendingLabel="…">Save</SubmitButton>
          </div>
        ) : (
          <Badge label={tech.status} tone={tech.status === 'active' ? 'success' : 'neutral'} />
        )}
      </form>
      {canDelete ? (
        <DeleteButton action={() => deleteTechnology(tech.id)} confirmMessage={`Delete "${tech.name}"?`} />
      ) : null}
    </div>
  );
}
