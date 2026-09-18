'use client';

import { useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Input, Textarea, Select, EmptyState, StatusPill } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import type { InterviewCategoryRow } from '@/lib/learning/queries';
import {
  createInterviewCategory,
  updateInterviewCategory,
  deleteInterviewCategory,
} from '@/app/(panel)/learning/interview-questions-global-actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

/** Category = a language/track (e.g. "Java"). More languages (Python, C, …)
 *  are added the same way, with no code change needed. */
export function CategoryManager({ categories, perms }: { categories: InterviewCategoryRow[]; perms: Perms }) {
  return (
    <Card>
      <CardHeader
        title="Categories (languages)"
        description="Shown at /practice/interview-questions. Deleting a category is only allowed once it holds no topics."
      />
      <div className="space-y-3">
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" description="Add the first one below (e.g. Java)." />
        ) : (
          categories.map((c) => <CategoryRow key={c.id} c={c} perms={perms} />)
        )}
        {perms.add ? <AddCategory /> : null}
      </div>
    </Card>
  );
}

function CategoryFields({ c }: { c?: InterviewCategoryRow }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_110px]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input name="name" required defaultValue={c?.name ?? ''} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input name="slug" defaultValue={c?.slug ?? ''} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="auto from name" />
        </div>
        <div>
          <Label htmlFor="icon">Icon (lucide name)</Label>
          <Input name="icon" defaultValue={c?.icon ?? ''} placeholder="Coffee" />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort</Label>
          <Input name="sort_order" type="number" min={0} defaultValue={c?.sort_order ?? 0} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea name="description" rows={2} defaultValue={c?.description ?? ''} />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={c?.status ?? 'published'}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_website" defaultChecked={c?.show_on_website ?? true} className="h-4 w-4 rounded border-border text-brand" />
          Show on Website
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_mobile" defaultChecked={c?.show_on_mobile ?? true} className="h-4 w-4 rounded border-border text-brand" />
          Show on Mobile
        </label>
      </div>
    </>
  );
}

function CategoryRow({ c, perms }: { c: InterviewCategoryRow; perms: Perms }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateInterviewCategory.bind(null, c.id), { ok: false } as ActionResult);
  useActionToast(state, () => setOpen(false));
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium text-ink">{c.name}</span>
          <div className="text-xs text-ink-faint">
            {c.slug} · {c.topic_count} topic{c.topic_count === 1 ? '' : 's'} · sort {c.sort_order}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={c.status} />
          {perms.edit ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="h-8 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
            >
              {open ? 'Close' : 'Edit'}
            </button>
          ) : null}
          {perms.delete ? (
            <DeleteButton action={() => deleteInterviewCategory(c.id)} confirmMessage={`Delete category "${c.name}"?`} />
          ) : null}
        </div>
      </div>
      {open && perms.edit ? (
        <form action={action} className="mt-3 space-y-3 border-t border-border pt-3">
          <CategoryFields c={c} />
          <div className="flex justify-end">
            <div className="w-24">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function AddCategory() {
  const [state, action] = useFormState(createInterviewCategory, { ok: false } as ActionResult);
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <span className="text-sm font-semibold text-ink">Add category</span>
      <CategoryFields />
      <div className="flex justify-end">
        <div className="w-32">
          <SubmitButton pendingLabel="Adding…">Add category</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export default CategoryManager;
