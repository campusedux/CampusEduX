'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createProject, updateProject, type ProjectFormValues } from '@/app/projects/actions';

interface Option {
  id: string;
  name: string;
}

interface ProjectFormProps {
  projectId?: string;
  branches: Option[];
  categories: Option[];
  technologies: Option[];
  initialValues?: Partial<ProjectFormValues>;
}

const DEFAULTS: ProjectFormValues = {
  title: '',
  slug: '',
  branchId: '',
  categoryId: null,
  shortDescription: '',
  description: '',
  price: 0,
  discountPrice: null,
  isPremium: true,
  difficulty: null,
  status: 'draft',
  technologyIds: [],
};

export function ProjectForm({ projectId, branches, categories, technologies, initialValues }: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>({ ...DEFAULTS, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!values.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!values.branchId) {
      setError('Choose a branch.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (projectId) {
          await updateProject(projectId, values);
          router.refresh();
        } else {
          await createProject(values);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Title</Label>
          <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. AI-Based Attendance System" />
        </div>
        <div className="col-span-2">
          <Label>Slug (leave blank to auto-generate)</Label>
          <Input value={values.slug} onChange={(e) => set('slug', e.target.value)} placeholder="ai-based-attendance-system" />
        </div>

        <div>
          <Label>Branch</Label>
          <Select value={values.branchId} onChange={(e) => set('branchId', e.target.value)}>
            <option value="">Select a branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={values.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Price (₹)</Label>
          <Input
            type="number"
            min={0}
            value={values.price}
            onChange={(e) => set('price', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Discount price (₹, optional)</Label>
          <Input
            type="number"
            min={0}
            value={values.discountPrice ?? ''}
            onChange={(e) => set('discountPrice', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <Label>Difficulty</Label>
          <Select value={values.difficulty ?? ''} onChange={(e) => set('difficulty', (e.target.value || null) as any)}>
            <option value="">Not set</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={values.status} onChange={(e) => set('status', e.target.value as ProjectFormValues['status'])}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>

        <div className="col-span-2">
          <Label>Short description</Label>
          <Input
            value={values.shortDescription}
            onChange={(e) => set('shortDescription', e.target.value)}
            placeholder="One line shown on catalog cards"
          />
        </div>
        <div className="col-span-2">
          <Label>Full description</Label>
          <Textarea rows={6} value={values.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="col-span-2">
          <Label>Technologies</Label>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => {
              const isSelected = values.technologyIds.includes(tech.id);
              return (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() =>
                    set(
                      'technologyIds',
                      isSelected
                        ? values.technologyIds.filter((id) => id !== tech.id)
                        : [...values.technologyIds, tech.id],
                    )
                  }
                  className={
                    isSelected
                      ? 'rounded-full bg-brand px-3 py-1 text-xs font-medium text-white'
                      : 'rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-muted hover:bg-surface-subtle'
                  }
                >
                  {tech.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : projectId ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </div>
  );
}
