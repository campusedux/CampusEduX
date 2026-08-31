'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { TEST_CATEGORIES, DIFFICULTIES } from '@/lib/placement/constants';

type Result = { ok: boolean; error?: string };

export function MockTestForm({
  mode,
  action,
  initial = {},
  companies = [],
  cancelHref,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: Record<string, any>;
  companies?: { id: string; name: string }[];
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Mock test">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initial.title ?? ''} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={initial.category ?? 'aptitude'}>
              {TEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="company_id">Company (for company-pattern tests)</Label>
            <Select id="company_id" name="company_id" defaultValue={initial.company_id ?? ''}>
              <option value="">— none —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input id="duration_minutes" name="duration_minutes" type="number" min="1" defaultValue={initial.duration_minutes ?? 30} />
          </div>
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select id="difficulty" name="difficulty" defaultValue={initial.difficulty ?? 'Medium'}>
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="total_marks">Total marks</Label>
            <Input id="total_marks" name="total_marks" type="number" min="0" defaultValue={initial.total_marks ?? 0} />
          </div>
          <div>
            <Label htmlFor="pass_marks">Pass marks</Label>
            <Input id="pass_marks" name="pass_marks" type="number" min="0" defaultValue={initial.pass_marks ?? 0} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={initial.is_published ?? true}
              className="h-4 w-4 rounded border-border text-brand"
            />
            Published
          </label>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={initial.description ?? ''} />
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
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create test' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
