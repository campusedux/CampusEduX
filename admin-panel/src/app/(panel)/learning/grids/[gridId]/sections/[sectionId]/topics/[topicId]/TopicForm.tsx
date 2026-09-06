'use client';

import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import type { AcademicOptions } from '@/lib/academic-targeting';
import { LEARNING_BUCKET, LEARNING_PATH_PREFIX } from '@/lib/learning/constants';
import type { LearningTopic } from '@/lib/learning/queries';
import { SlugField, PublishFields } from '@/app/(panel)/learning/_components/FormFields';
import { useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import { updateTopic } from '@/app/(panel)/learning/actions';

export function TopicForm({
  topic,
  canEdit,
  options,
}: {
  topic: LearningTopic;
  canEdit: boolean;
  options: AcademicOptions;
}) {
  const [state, action] = useFormState(
    updateTopic.bind(null, topic.id, topic.section_id, topic.grid_id),
    { ok: false } as ActionResult,
  );
  useActionToast(state);

  return (
    <Card>
      <CardHeader title="Topic details" />
      <form action={action} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input name="title" required defaultValue={topic.title} />
            </div>
            <SlugField defaultValue={topic.slug} from="title" />
          </div>
          <div>
            <Label htmlFor="short_description">Short description</Label>
            <Textarea
              name="short_description"
              rows={2}
              defaultValue={topic.short_description}
              placeholder="Shown under the title, in search results and as the page meta description."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="icon">Icon (emoji or name)</Label>
              <Input name="icon" defaultValue={topic.icon ?? ''} placeholder="📘  or  book" />
            </div>
            <input type="hidden" name="company_id" value={topic.company_id ?? ''} />
            <div>
              <Label>Icon image (optional)</Label>
              <ImageUploader
                name="icon_url"
                bucket={LEARNING_BUCKET}
                pathPrefix={`${LEARNING_PATH_PREFIX}/topics`}
                defaultValue={topic.icon_url ?? ''}
                disabled={!canEdit}
                aspect="square"
                helpText="Square · JPG, PNG or WebP"
              />
            </div>
          </div>

          <PublishFields
            status={topic.status}
            showWebsite={topic.show_on_website}
            showMobile={topic.show_on_mobile}
            premium={topic.is_premium}
          />

          <div className="rounded-lg border border-border bg-surface-subtle/40 p-3">
            <p className="mb-2 text-sm font-semibold text-ink">Academic targeting</p>
            <AcademicTargetingFields
              options={options}
              disabled={!canEdit}
              initial={{
                target_type: topic.target_type,
                target_course_id: topic.target_course_id,
                target_branch_ids: topic.target_branch_ids,
                target_year_id: topic.target_year_id,
              }}
            />
          </div>

          {canEdit ? (
            <div className="flex justify-end">
              <div className="w-32">
                <SubmitButton pendingLabel="Saving…">Save topic</SubmitButton>
              </div>
            </div>
          ) : null}
        </fieldset>
      </form>
    </Card>
  );
}
