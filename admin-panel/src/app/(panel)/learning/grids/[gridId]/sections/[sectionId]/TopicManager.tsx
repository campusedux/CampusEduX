'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { ChevronRight, Globe, Smartphone, Lock } from 'lucide-react';
import { Card, CardHeader, Label, Input, Textarea, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import type { LearningTopic } from '@/lib/learning/queries';
import { SlugField } from '@/app/(panel)/learning/_components/FormFields';
import { ReorderButtons, StatusSelect, useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import { VisibilityToggle } from '@/app/(panel)/learning/GridTable';
import { createTopic, deleteTopic, reorderTopic, setTopicField } from '@/app/(panel)/learning/actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function TopicManager({
  gridId,
  sectionId,
  topics,
  perms,
}: {
  gridId: string;
  sectionId: string;
  topics: LearningTopic[];
  perms: Perms;
}) {
  const base = `/learning/grids/${gridId}/sections/${sectionId}/topics`;
  return (
    <Card>
      <CardHeader title="Topics" description="Each topic is one documentation page. Open a topic to write its content." />
      <div className="space-y-4">
        {perms.add ? <AddTopicForm gridId={gridId} sectionId={sectionId} /> : null}

        {topics.length === 0 ? (
          <EmptyState title="No topics yet" description="Add the first topic above (for example “Inheritance”)." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {topics.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 p-3">
                {perms.edit ? <ReorderButtons onMove={(dir) => reorderTopic(t.id, sectionId, gridId, dir)} /> : null}
                <div className="min-w-[160px] flex-1">
                  <Link href={`${base}/${t.id}`} className="font-semibold text-ink hover:text-brand">
                    {t.title}
                  </Link>
                  <p className="text-xs text-ink-faint">
                    /{t.slug}
                    {t.source_prep_note_id ? ' · imported' : ''}
                  </p>
                </div>
                {perms.edit ? (
                  <button
                    type="button"
                    title={t.is_premium ? 'Premium topic' : 'Free topic'}
                    onClick={() => setTopicField(t.id, sectionId, gridId, 'is_premium', !t.is_premium)}
                    className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-medium ${
                      t.is_premium ? 'border-warning/40 bg-warning/10 text-[#B77A1B]' : 'border-border text-ink-faint'
                    }`}
                  >
                    <Lock size={12} /> {t.is_premium ? 'Premium' : 'Free'}
                  </button>
                ) : null}
                {perms.edit ? (
                  <StatusSelect
                    value={t.status}
                    onChange={(next) => setTopicField(t.id, sectionId, gridId, 'status', next)}
                  />
                ) : null}
                <div className="flex items-center gap-2">
                  <VisibilityToggle
                    label="Web"
                    icon={<Globe size={13} />}
                    on={t.show_on_website}
                    disabled={!perms.edit}
                    onToggle={(next) => setTopicField(t.id, sectionId, gridId, 'show_on_website', next)}
                  />
                  <VisibilityToggle
                    label="App"
                    icon={<Smartphone size={13} />}
                    on={t.show_on_mobile}
                    disabled={!perms.edit}
                    onToggle={(next) => setTopicField(t.id, sectionId, gridId, 'show_on_mobile', next)}
                  />
                </div>
                {perms.delete ? (
                  <DeleteButton
                    action={() => deleteTopic(t.id, sectionId, gridId)}
                    confirmMessage={`Delete topic "${t.title}" and all its content blocks? This cannot be undone.`}
                  />
                ) : null}
                <Link
                  href={`${base}/${t.id}`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
                >
                  Open <ChevronRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function AddTopicForm({ gridId, sectionId }: { gridId: string; sectionId: string }) {
  const [state, action] = useFormState(
    createTopic.bind(null, sectionId, gridId),
    { ok: false } as ActionResult,
  );
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div>
          <Label htmlFor="title">New topic title</Label>
          <Input name="title" required placeholder="Inheritance" />
        </div>
        <SlugField from="title" />
      </div>
      <div>
        <Label htmlFor="short_description">Short description (optional)</Label>
        <Textarea name="short_description" rows={2} placeholder="Shown under the title and in search results." />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" name="is_premium" className="h-4 w-4 rounded border-border text-brand" />
          Premium only
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_website" defaultChecked className="h-4 w-4 rounded border-border text-brand" />
          Website
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_mobile" defaultChecked className="h-4 w-4 rounded border-border text-brand" />
          Mobile app
        </label>
      </div>
      <input type="hidden" name="status" value="draft" />
      <div className="flex justify-end">
        <div className="w-32">
          <SubmitButton pendingLabel="Adding…">Add topic</SubmitButton>
        </div>
      </div>
    </form>
  );
}
