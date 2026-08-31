'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useToast } from '@/components/ui/toast';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import type { AcademicOptions } from '@/lib/academic-targeting';
import { NOTE_CATEGORIES } from '@/lib/placement/constants';
import type { AdminPrepNote } from '@/lib/placement/queries';
import { createNote, updateNote, deleteNote, toggleNotePublished } from '../actions';

type Result = { ok: boolean; error?: string };
type Perms = { add: boolean; edit: boolean; delete: boolean };

function useSaveToast(state: Result, reset?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      reset?.();
      router.refresh();
    }
  }, [state, toast, router, reset]);
}

export function NotesManager({
  notes,
  perms,
  academicOptions,
}: {
  notes: AdminPrepNote[];
  perms: Perms;
  academicOptions: AcademicOptions;
}) {
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm academicOptions={academicOptions} /> : null}

      {notes.length === 0 ? (
        <Card>
          <EmptyState title="No notes yet" description="Add your first preparation note above." />
        </Card>
      ) : (
        <Card>
          <CardHeader title="All notes" description={`${notes.length} note${notes.length === 1 ? '' : 's'}`} />
          <div className="space-y-3">
            {notes.map((note) => (
              <Row key={note.id} note={note} perms={perms} academicOptions={academicOptions} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Fields({
  note,
  disabled,
  academicOptions,
}: {
  note?: AdminPrepNote;
  disabled?: boolean;
  academicOptions: AcademicOptions;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input name="title" required defaultValue={note?.title ?? ''} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={note?.category ?? 'General Placement'} disabled={disabled}>
            {NOTE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="topic">Topic</Label>
          <Input name="topic" defaultValue={note?.topic ?? ''} disabled={disabled} placeholder="e.g. Percentages" />
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input name="tags" defaultValue={(note?.tags ?? []).join(', ')} disabled={disabled} placeholder="quant, shortcut" />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea name="content" rows={8} defaultValue={note?.content ?? ''} disabled={disabled} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="file_url">PDF / file URL</Label>
          <Input name="file_url" type="url" defaultValue={note?.file_url ?? ''} disabled={disabled} placeholder="https://…" />
        </div>
        <div>
          <Label>Thumbnail image</Label>
          <ImageUploader
            name="thumbnail_url"
            bucket="admin-media"
            pathPrefix="prep-notes"
            defaultValue={note?.thumbnail_url ?? ''}
            disabled={disabled}
            aspect="video"
            helpText="Optional cover image · JPG, PNG or WebP"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink-muted">
          Academic targeting — global material stays visible to all; branch material is only shown to the branches you pick.
        </p>
        <AcademicTargetingFields
          options={academicOptions}
          disabled={disabled}
          initial={{
            target_type: (note as { target_type?: string | null } | undefined)?.target_type ?? null,
            target_course_id: (note as { target_course_id?: string | null } | undefined)?.target_course_id ?? null,
            target_branch_ids: (note as { target_branch_ids?: string[] | null } | undefined)?.target_branch_ids ?? null,
            target_year_id: (note as { target_year_id?: string | null } | undefined)?.target_year_id ?? null,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="is_premium"
            defaultChecked={note?.is_premium ?? false}
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-brand"
          />
          Premium only
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={note?.is_published ?? false}
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-brand"
          />
          Published
        </label>
      </div>
    </div>
  );
}

function AddForm({ academicOptions }: { academicOptions: AcademicOptions }) {
  const [state, action] = useFormState(createNote, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add note" />
      <form ref={ref} action={action} className="space-y-3">
        <Fields academicOptions={academicOptions} />
        <div className="flex justify-end">
          <div className="w-28">
            <SubmitButton pendingLabel="Adding…">Add note</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Row({ note, perms, academicOptions }: { note: AdminPrepNote; perms: Perms; academicOptions: AcademicOptions }) {
  const [state, action] = useFormState(updateNote.bind(null, note.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={note.category} tone="neutral" />
          {note.is_premium ? <Badge label="Premium" tone="warning" /> : null}
          <ToggleSwitch
            checked={note.is_published}
            action={(next) => toggleNotePublished(note.id, next)}
            labelOn="Published"
            labelOff="Draft"
            disabled={!perms.edit}
          />
        </div>
        {perms.delete ? (
          <DeleteButton action={() => deleteNote(note.id)} confirmMessage={`Delete "${note.title}"?`} />
        ) : null}
      </div>
      <form action={action} className="space-y-3">
        <Fields note={note} disabled={!perms.edit} academicOptions={academicOptions} />
        {perms.edit ? (
          <div className="flex justify-end">
            <div className="w-20">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
