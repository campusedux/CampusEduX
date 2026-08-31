'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import type { AcademicOptions } from '@/lib/academic-targeting';

type Result = { ok: boolean; error?: string };

export interface ProjectFormInitial {
  title?: string;
  category_id?: string | null;
  category_name?: string | null;
  price?: number;
  tech_stack?: string[];
  description?: string;
  status?: string | null;
  is_premium?: boolean;
  thumbnail_url?: string | null;
  live_demo_url?: string | null;
  github_url?: string | null;
  platform_fee_percent?: number;
  license?: string;
  developer_name?: string;
  target_type?: string | null;
  target_course_id?: string | null;
  target_branch_ids?: string[] | null;
  target_year_id?: string | null;
}

export function ProjectForm({
  mode,
  action,
  initial = {},
  categories,
  technologies,
  academicOptions,
  cancelHref,
  projectId,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: ProjectFormInitial;
  categories: { id: string; name: string }[];
  technologies: { name: string }[];
  academicOptions: AcademicOptions;
  cancelHref: string;
  projectId?: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="category_name" value={initial.category_name ?? ''} />

      <Section title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initial.title ?? ''} />
          </div>
          <div>
            <Label htmlFor="category_id">Category</Label>
            <Select id="category_id" name="category_id" defaultValue={initial.category_id ?? ''}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" name="price" type="number" min="0" step="1" defaultValue={initial.price ?? 0} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tech_stack">Tech stack (comma separated)</Label>
            <Input
              id="tech_stack"
              name="tech_stack"
              list="tech-options"
              defaultValue={(initial.tech_stack ?? []).join(', ')}
              placeholder="React, Node.js, PostgreSQL"
            />
            <datalist id="tech-options">
              {technologies.map((t) => (
                <option key={t.name} value={t.name} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={initial.description ?? ''} />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={initial.status ?? 'published'}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
            <input type="checkbox" name="is_premium" defaultChecked={initial.is_premium} className="h-4 w-4 rounded border-border text-brand" />
            Premium project
          </label>
        </div>
      </Section>

      <Section title="Media & Links" description={mode === 'create' ? 'Upload the video and extra files after creating the project.' : undefined}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Thumbnail image</Label>
            <ImageUploader
              name="thumbnail_url"
              bucket="project-media"
              pathPrefix={projectId ? `projects/${projectId}` : 'projects'}
              defaultValue={initial.thumbnail_url ?? ''}
              aspect="video"
              helpText="The main image on project cards · JPG, PNG or WebP"
            />
          </div>
          <div>
            <Label htmlFor="live_demo_url">Live demo URL</Label>
            <Input id="live_demo_url" name="live_demo_url" defaultValue={initial.live_demo_url ?? ''} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input id="github_url" name="github_url" defaultValue={initial.github_url ?? ''} placeholder="https://github.com/…" />
          </div>
        </div>
      </Section>

      <Section
        title="Academic targeting"
        description="Global stays visible to everyone. A course-wide project is ranked up for that course. A branch project is only shown to the branches you pick."
      >
        <AcademicTargetingFields
          options={academicOptions}
          initial={{
            target_type: initial.target_type,
            target_course_id: initial.target_course_id,
            target_branch_ids: initial.target_branch_ids,
            target_year_id: initial.target_year_id,
          }}
        />
      </Section>

      <Section title="Pricing & License">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="platform_fee_percent">Platform fee %</Label>
            <Input
              id="platform_fee_percent"
              name="platform_fee_percent"
              type="number"
              min="0"
              step="0.5"
              defaultValue={initial.platform_fee_percent ?? 2}
            />
          </div>
          <div>
            <Label htmlFor="license">License</Label>
            <Input id="license" name="license" defaultValue={initial.license ?? 'Regular License'} />
          </div>
          <div>
            <Label htmlFor="developer_name">Developer name</Label>
            <Input id="developer_name" name="developer_name" defaultValue={initial.developer_name ?? 'CampusEduX Studio'} />
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
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create project' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
