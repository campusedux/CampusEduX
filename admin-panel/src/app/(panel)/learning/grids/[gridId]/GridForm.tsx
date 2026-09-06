'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import { useToast } from '@/components/ui/toast';
import type { AcademicOptions } from '@/lib/academic-targeting';
import { LEARNING_BUCKET, LEARNING_PATH_PREFIX, GRID_TYPES, GRID_TYPE_LABEL } from '@/lib/learning/constants';
import type { LearningGrid } from '@/lib/learning/queries';
import { SlugField, PublishFields } from '@/app/(panel)/learning/_components/FormFields';
import { createGrid, updateGrid } from '@/app/(panel)/learning/actions';

type Result = { ok: boolean; error?: string; id?: string };

export function GridForm({
  grid,
  canEdit,
  options,
}: {
  grid?: LearningGrid;
  canEdit: boolean;
  options: AcademicOptions;
}) {
  const isEdit = Boolean(grid);
  const action = isEdit ? updateGrid.bind(null, grid!.id) : createGrid;
  const [state, formAction] = useFormState(action as never, { ok: false } as Result);
  const router = useRouter();
  const { toast } = useToast();
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: isEdit ? 'Grid saved' : 'Grid created', variant: 'success' });
      if (!isEdit && state.id) router.push(`/learning/grids/${state.id}`);
      else router.refresh();
    }
  }, [state, isEdit, router, toast]);

  return (
    <Card>
      <CardHeader
        title={isEdit ? 'Grid details' : 'New learning grid'}
        description="A grid is one learning area — e.g. “Java Tutorial”, “Python Tutorial”, “Communication Skills”."
      />
      <form action={formAction} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input name="name" required defaultValue={grid?.name ?? ''} placeholder="Communication Skills" />
            </div>
            <SlugField defaultValue={grid?.slug} from="name" />
          </div>

          <div>
            <Label htmlFor="description">Short description</Label>
            <Textarea
              name="description"
              rows={3}
              defaultValue={grid?.description ?? ''}
              placeholder="One or two sentences shown on the grid card and the resource landing page."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="grid_type">Grid type</Label>
              <Select name="grid_type" defaultValue={grid?.grid_type ?? 'content'}>
                {GRID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {GRID_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-ink-faint">
                Both types are ordinary Grid → (Section) → Topic → Content trees; “Custom” only changes the label shown
                on the site.
              </p>
            </div>
            <div>
              <Label htmlFor="accent_color">Accent colour</Label>
              <Input name="accent_color" defaultValue={grid?.accent_color ?? ''} placeholder="#4F39F6" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="icon">Icon (emoji or name)</Label>
              <Input name="icon" defaultValue={grid?.icon ?? ''} placeholder="💬  or  message-square" />
            </div>
            <div>
              <Label>Icon image (optional)</Label>
              <ImageUploader
                name="icon_url"
                bucket={LEARNING_BUCKET}
                pathPrefix={`${LEARNING_PATH_PREFIX}/grids`}
                defaultValue={grid?.icon_url ?? ''}
                disabled={!canEdit}
                aspect="square"
                helpText="Square logo · JPG, PNG or WebP"
              />
            </div>
          </div>

          <div>
            <Label>Cover image (optional)</Label>
            <ImageUploader
              name="cover_image_url"
              bucket={LEARNING_BUCKET}
              pathPrefix={`${LEARNING_PATH_PREFIX}/grids`}
              defaultValue={grid?.cover_image_url ?? ''}
              disabled={!canEdit}
              aspect="wide"
              helpText="Wide banner shown on the resource page"
            />
          </div>

          <PublishFields
            status={grid?.status ?? 'draft'}
            showWebsite={grid?.show_on_website ?? true}
            showMobile={grid?.show_on_mobile ?? true}
            premium={grid?.is_premium ?? false}
            featured={grid?.is_featured ?? false}
          />

          <div className="rounded-lg border border-border bg-surface-subtle/40 p-3">
            <p className="mb-2 text-sm font-semibold text-ink">Academic targeting</p>
            <p className="mb-3 text-xs text-ink-faint">
              Course / Branch / Year is enforced by the database (RLS) — a grid targeted at a course only reaches
              students on that course. Leave as <em>Global</em> for everyone.
            </p>
            <AcademicTargetingFields
              options={options}
              disabled={!canEdit}
              initial={{
                target_type: grid?.target_type,
                target_course_id: grid?.target_course_id,
                target_branch_ids: grid?.target_branch_ids,
                target_year_id: grid?.target_year_id,
              }}
            />
          </div>

          {canEdit ? (
            <div className="flex justify-end">
              <div className="w-36">
                <SubmitButton pendingLabel="Saving…">{isEdit ? 'Save grid' : 'Create grid'}</SubmitButton>
              </div>
            </div>
          ) : null}
        </fieldset>
      </form>
    </Card>
  );
}
