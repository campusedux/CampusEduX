'use client';

import { useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Input, Textarea, Select, EmptyState, StatusPill } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ReorderButtons, useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import type { InterviewCategoryRow, InterviewTopicRow } from '@/lib/learning/queries';
import {
  createInterviewTopic,
  updateInterviewTopic,
  deleteInterviewTopic,
} from '@/app/(panel)/learning/interview-questions-global-actions';
import { reorderInterviewTopic } from '@/app/(panel)/learning/interview-questions-actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

/** Topic = a subject within a category (e.g. "OOP" within "Java"), grouped by
 *  category so a 26-topic language stays scannable. */
export function TopicManager({
  categories,
  topics,
  perms,
}: {
  categories: InterviewCategoryRow[];
  topics: InterviewTopicRow[];
  perms: Perms;
}) {
  return (
    <Card>
      <CardHeader
        title="Topics"
        description="Shown at /practice/interview-questions/<category>. Deleting a topic is only allowed once it holds no questions."
      />
      <div className="space-y-5">
        {categories.length === 0 ? (
          <EmptyState title="Add a category first" description="A topic must belong to a category." />
        ) : (
          categories.map((cat) => {
            const catTopics = topics.filter((t) => t.category_id === cat.id);
            return (
              <div key={cat.id}>
                <h3 className="mb-2 text-sm font-semibold text-ink">{cat.name}</h3>
                <div className="space-y-2">
                  {catTopics.length === 0 ? (
                    <p className="text-xs text-ink-faint">No topics yet.</p>
                  ) : (
                    catTopics.map((t, i) => (
                      <TopicRow
                        key={t.id}
                        t={t}
                        categories={categories}
                        perms={perms}
                        disabledUp={i === 0}
                        disabledDown={i === catTopics.length - 1}
                      />
                    ))
                  )}
                  {perms.add ? <AddTopic defaultCategoryId={cat.id} categories={categories} /> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function TopicFields({ t, categories, defaultCategoryId }: { t?: InterviewTopicRow; categories: InterviewCategoryRow[]; defaultCategoryId?: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_110px]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input name="name" required defaultValue={t?.name ?? ''} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input name="slug" defaultValue={t?.slug ?? ''} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="auto from name" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={t?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ''} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sort_order">Sort</Label>
          <Input name="sort_order" type="number" min={0} defaultValue={t?.sort_order ?? 0} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea name="description" rows={2} defaultValue={t?.description ?? ''} />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={t?.status ?? 'published'}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_website" defaultChecked={t?.show_on_website ?? true} className="h-4 w-4 rounded border-border text-brand" />
          Show on Website
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_mobile" defaultChecked={t?.show_on_mobile ?? true} className="h-4 w-4 rounded border-border text-brand" />
          Show on Mobile
        </label>
      </div>
    </>
  );
}

function TopicRow({
  t,
  categories,
  perms,
  disabledUp,
  disabledDown,
}: {
  t: InterviewTopicRow;
  categories: InterviewCategoryRow[];
  perms: Perms;
  disabledUp: boolean;
  disabledDown: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateInterviewTopic.bind(null, t.id), { ok: false } as ActionResult);
  useActionToast(state, () => setOpen(false));
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {perms.edit ? (
            <ReorderButtons
              onMove={(dir) => reorderInterviewTopic(t.id, t.category_id, dir)}
              disabled={disabledUp && disabledDown}
            />
          ) : null}
          <div className="min-w-0">
            <span className="font-medium text-ink">{t.name}</span>
            <div className="text-xs text-ink-faint">
              {t.slug} · {t.question_count} question{t.question_count === 1 ? '' : 's'} · sort {t.sort_order}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={t.status} />
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
            <DeleteButton action={() => deleteInterviewTopic(t.id)} confirmMessage={`Delete topic "${t.name}"?`} />
          ) : null}
        </div>
      </div>
      {open && perms.edit ? (
        <form action={action} className="mt-3 space-y-3 border-t border-border pt-3">
          <TopicFields t={t} categories={categories} />
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

function AddTopic({ categories, defaultCategoryId }: { categories: InterviewCategoryRow[]; defaultCategoryId: string }) {
  const [state, action] = useFormState(createInterviewTopic, { ok: false } as ActionResult);
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <span className="text-sm font-semibold text-ink">Add topic</span>
      <TopicFields categories={categories} defaultCategoryId={defaultCategoryId} />
      <div className="flex justify-end">
        <div className="w-28">
          <SubmitButton pendingLabel="Adding…">Add topic</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export default TopicManager;
