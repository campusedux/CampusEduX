'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { ChevronRight, Globe, Smartphone } from 'lucide-react';
import { Card, CardHeader, Label, Input, Textarea, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import type { LearningSection } from '@/lib/learning/queries';
import { SlugField } from '@/app/(panel)/learning/_components/FormFields';
import { ReorderButtons, StatusSelect, useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import { VisibilityToggle } from '@/app/(panel)/learning/GridTable';
import { createSection, deleteSection, reorderSection, setSectionField } from '@/app/(panel)/learning/actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function SectionManager({
  gridId,
  gridSlug,
  sections,
  perms,
}: {
  gridId: string;
  gridSlug: string;
  sections: LearningSection[];
  perms: Perms;
}) {
  return (
    <Card>
      <CardHeader
        title="Sections"
        description="Group topics into chapters — e.g. Basics, OOP, Collections. Open a section to add its topics."
      />
      <div className="space-y-4">
        {perms.add ? <AddSectionForm gridId={gridId} /> : null}

        {sections.length === 0 ? (
          <EmptyState title="No sections yet" description="Add the first section above (for example “Basics”)." />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sections.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 p-3">
                {perms.edit ? <ReorderButtons onMove={(dir) => reorderSection(s.id, gridId, dir)} /> : null}
                <div className="min-w-[160px] flex-1">
                  <Link
                    href={`/learning/grids/${gridId}/sections/${s.id}`}
                    className="font-semibold text-ink hover:text-brand"
                  >
                    {s.name}
                  </Link>
                  <p className="text-xs text-ink-faint">/{s.slug}</p>
                </div>
                {perms.edit ? (
                  <StatusSelect value={s.status} onChange={(next) => setSectionField(s.id, gridId, 'status', next)} />
                ) : null}
                <div className="flex items-center gap-2">
                  <VisibilityToggle
                    label="Web"
                    icon={<Globe size={13} />}
                    on={s.show_on_website}
                    disabled={!perms.edit}
                    onToggle={(next) => setSectionField(s.id, gridId, 'show_on_website', next)}
                  />
                  <VisibilityToggle
                    label="App"
                    icon={<Smartphone size={13} />}
                    on={s.show_on_mobile}
                    disabled={!perms.edit}
                    onToggle={(next) => setSectionField(s.id, gridId, 'show_on_mobile', next)}
                  />
                </div>
                {perms.delete ? (
                  <DeleteButton
                    action={() => deleteSection(s.id, gridId)}
                    confirmMessage={`Delete section "${s.name}"? It must have no topics.`}
                  />
                ) : null}
                <Link
                  href={`/learning/grids/${gridId}/sections/${s.id}`}
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

function AddSectionForm({ gridId }: { gridId: string }) {
  const [state, action] = useFormState(createSection.bind(null, gridId), { ok: false } as ActionResult);
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div>
          <Label htmlFor="name">New section name</Label>
          <Input name="name" required placeholder="Basics" />
        </div>
        <SlugField from="name" />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea name="description" rows={2} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
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
          <SubmitButton pendingLabel="Adding…">Add section</SubmitButton>
        </div>
      </div>
    </form>
  );
}
