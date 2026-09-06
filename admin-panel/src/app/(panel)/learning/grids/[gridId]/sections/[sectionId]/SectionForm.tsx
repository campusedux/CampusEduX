'use client';

import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Input, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import type { LearningSection } from '@/lib/learning/queries';
import { SlugField, PublishFields } from '@/app/(panel)/learning/_components/FormFields';
import { useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import { updateSection } from '@/app/(panel)/learning/actions';

export function SectionForm({ section, canEdit }: { section: LearningSection; canEdit: boolean }) {
  const [state, action] = useFormState(
    updateSection.bind(null, section.id, section.grid_id),
    { ok: false } as ActionResult,
  );
  useActionToast(state);

  return (
    <Card>
      <CardHeader title="Section details" />
      <form action={action} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input name="name" required defaultValue={section.name} />
            </div>
            <SlugField defaultValue={section.slug} from="name" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea name="description" rows={2} defaultValue={section.description} />
          </div>
          <PublishFields
            status={section.status}
            showWebsite={section.show_on_website}
            showMobile={section.show_on_mobile}
          />
          {canEdit ? (
            <div className="flex justify-end">
              <div className="w-32">
                <SubmitButton pendingLabel="Saving…">Save section</SubmitButton>
              </div>
            </div>
          ) : null}
        </fieldset>
      </form>
    </Card>
  );
}
