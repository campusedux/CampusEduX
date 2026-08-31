'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function TemplateForm({
  mode,
  action,
  initial = {},
  categories,
  templateId,
  cancelHref,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: Record<string, any>;
  categories: { id: string; name: string }[];
  templateId?: string;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <Section title="Basic Information">
          <div className="grid gap-4 sm:grid-cols-2">
            {mode === 'create' ? (
              <div>
                <Label htmlFor="id">Template id (optional)</Label>
                <Input id="id" name="id" placeholder="auto from title" defaultValue={initial.id ?? ''} />
              </div>
            ) : null}
            <div>
              <Label htmlFor="name">Title</Label>
              <Input id="name" name="name" required defaultValue={initial.name ?? ''} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={initial.category ?? 'General'}>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="accent_color">Accent colour</Label>
              <Input id="accent_color" name="accent_color" type="color" defaultValue={initial.accent_color ?? '#4F39F6'} className="h-10 p-1" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={initial.status ?? 'active'}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort_order">Sort order</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue={initial.sort_order ?? 0} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
              <input type="checkbox" name="is_premium" defaultChecked={initial.is_premium} className="h-4 w-4 rounded border-border text-brand" />
              Premium template
            </label>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={initial.description ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="features">Feature checklist (one per line)</Label>
              <Textarea id="features" name="features" rows={4} defaultValue={(initial.features ?? []).join('\n')} placeholder={'ATS-friendly single column\nProfile photo slot\nSkills matrix'} />
            </div>
            <div className="sm:col-span-2">
              <Label>Preview image</Label>
              <ImageUploader
                name="preview_image_url"
                bucket="resume-templates"
                pathPrefix={templateId ?? 'new'}
                defaultValue={initial.preview_image_url ?? ''}
                aspect="video"
                helpText="Shown on the template picker in the app · JPG, PNG or WebP"
              />
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-end gap-2">
          <Link
            href={cancelHref}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            Cancel
          </Link>
          <div className="w-36">
            <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create template' : 'Save changes'}</SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
