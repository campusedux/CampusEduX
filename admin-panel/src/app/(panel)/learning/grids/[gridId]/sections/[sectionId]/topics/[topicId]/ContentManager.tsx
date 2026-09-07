'use client';

import { useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Input, Select, Textarea, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import type { AcademicOptions } from '@/lib/academic-targeting';
import { CONTENT_TYPES, CONTENT_TYPE_LABEL, DIFFICULTIES } from '@/lib/learning/constants';
import type { LearningContent } from '@/lib/learning/queries';
import { ReorderButtons, useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import { createContent, updateContent, deleteContent, reorderContent } from '@/app/(panel)/learning/actions';
import { MarkdownEditor } from '@/components/learning/MarkdownEditor';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function ContentManager({
  topicId,
  path,
  contents,
  perms,
  options,
}: {
  topicId: string;
  path: string;
  contents: LearningContent[];
  perms: Perms;
  options: AcademicOptions;
}) {
  return (
    <Card>
      <CardHeader
        title="Content"
        description="One or more ordered blocks make up the topic page. Markdown — headings, lists, tables, code, links, images — plus per-block type, difficulty, tags, files, premium and academic targeting."
      />
      <div className="space-y-4">
        {contents.length === 0 ? (
          <EmptyState title="No content yet" description="Add the first content block below." />
        ) : (
          contents.map((c, i) => (
            <BlockForm key={c.id} block={c} index={i} total={contents.length} path={path} perms={perms} options={options} />
          ))
        )}
        {perms.add ? <AddBlockForm topicId={topicId} path={path} options={options} /> : null}
      </div>
    </Card>
  );
}

/** The shared field set — used by both the edit and the add form. */
function BlockFields({
  block,
  options,
  onDirty,
}: {
  block?: LearningContent;
  options: AcademicOptions;
  onDirty?: () => void;
}) {
  const metaType = (block?.metadata as { content_type?: string } | undefined)?.content_type ?? 'article';
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_150px]">
        <div>
          <Label htmlFor="title">Title (optional)</Label>
          <Input name="title" defaultValue={block?.title ?? ''} onChange={onDirty} placeholder="Block title" />
        </div>
        <div>
          <Label htmlFor="content_type">Type</Label>
          <Select name="content_type" defaultValue={metaType} onChange={onDirty}>
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={block?.status ?? 'published'} onChange={onDirty}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div>
          <Label htmlFor="heading">Block heading (optional)</Label>
          <Input name="heading" defaultValue={block?.heading ?? ''} onChange={onDirty} placeholder="e.g. Overview" />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input name="slug" defaultValue={block?.slug ?? ''} onChange={onDirty} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="auto" />
        </div>
      </div>

      <div>
        <Label htmlFor="short_description">Short description (optional)</Label>
        <Textarea name="short_description" rows={2} defaultValue={block?.short_description ?? ''} onChange={onDirty} />
      </div>

      <div>
        <Label htmlFor="content_format">Format</Label>
        <Select name="content_format" defaultValue={block?.content_format ?? 'markdown'} onChange={onDirty}>
          <option value="markdown">Markdown</option>
          <option value="plain">Plain text</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="body">Body</Label>
        <MarkdownEditor name="body" defaultValue={block?.body ?? ''} onDirty={onDirty ? () => onDirty() : undefined} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="difficulty">Difficulty (optional)</Label>
          <Select name="difficulty" defaultValue={block?.difficulty ?? ''} onChange={onDirty}>
            <option value="">—</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="estimated_minutes">Est. time (min)</Label>
          <Input name="estimated_minutes" type="number" min={0} defaultValue={block?.estimated_minutes ?? ''} onChange={onDirty} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="is_premium" defaultChecked={block?.is_premium ?? false} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
            Premium only
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input name="tags" defaultValue={(block?.tags ?? []).join(', ')} onChange={onDirty} placeholder="arrays, two-pointers" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="file_url">Attachment URL (optional)</Label>
          <Input name="file_url" type="url" defaultValue={block?.file_url ?? ''} onChange={onDirty} placeholder="https://…/notes.pdf" />
        </div>
        <div>
          <Label htmlFor="video_url">Video URL (optional)</Label>
          <Input name="video_url" type="url" defaultValue={block?.video_url ?? ''} onChange={onDirty} placeholder="https://…" />
        </div>
        <div>
          <Label htmlFor="external_url">External URL (optional)</Label>
          <Input name="external_url" type="url" defaultValue={block?.external_url ?? ''} onChange={onDirty} placeholder="https://…" />
        </div>
      </div>

      <details className="rounded-lg border border-border bg-surface-subtle/40 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Audience (academic targeting)</summary>
        <p className="mb-3 mt-2 text-xs text-ink-faint">
          Usually left <em>Global</em> — the block inherits the topic&apos;s targeting. Set this only to narrow a
          single block further. Enforced by the database.
        </p>
        <AcademicTargetingFields
          options={options}
          initial={{
            target_type: block?.target_type,
            target_course_id: block?.target_course_id,
            target_branch_ids: block?.target_branch_ids,
            target_year_id: block?.target_year_id,
          }}
        />
      </details>
    </>
  );
}

function BlockForm({
  block,
  index,
  total,
  path,
  perms,
  options,
}: {
  block: LearningContent;
  index: number;
  total: number;
  path: string;
  perms: Perms;
  options: AcademicOptions;
}) {
  const [state, action] = useFormState(updateContent.bind(null, block.id, path), { ok: false } as ActionResult);
  const [dirty, setDirty] = useState(false);
  useActionToast(state, () => setDirty(false));

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {perms.edit ? <ReorderButtons onMove={(dir) => reorderContent(block.id, path, dir)} disabled={total < 2} /> : null}
          <span className="text-xs font-medium text-ink-faint">Block {index + 1}</span>
          {dirty ? <span className="text-xs font-medium text-warning">● unsaved</span> : null}
        </div>
        {perms.delete ? (
          <DeleteButton action={() => deleteContent(block.id, path)} confirmMessage="Delete this content block?" />
        ) : null}
      </div>

      <fieldset disabled={!perms.edit} className="space-y-3">
        <BlockFields block={block} options={options} onDirty={() => setDirty(true)} />
        {perms.edit ? (
          <div className="flex justify-end">
            <div className="w-24">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

function AddBlockForm({ topicId, path, options }: { topicId: string; path: string; options: AcademicOptions }) {
  const [state, action] = useFormState(createContent.bind(null, topicId, path), { ok: false } as ActionResult);
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <span className="text-sm font-semibold text-ink">Add content block</span>
      <BlockFields options={options} />
      <div className="flex justify-end">
        <div className="w-32">
          <SubmitButton pendingLabel="Adding…">Add block</SubmitButton>
        </div>
      </div>
    </form>
  );
}
