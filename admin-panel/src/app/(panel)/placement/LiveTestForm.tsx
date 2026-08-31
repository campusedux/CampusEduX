'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { LIVE_STATUS } from '@/lib/placement/constants';

type Result = { ok: boolean; error?: string };

const CATS = ['aptitude', 'logical', 'verbal', 'hr', 'company', 'dsa'];

/** DB timestamptz → value for <input type="datetime-local"> */
const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

export function LiveTestForm({
  mode,
  action,
  initial = {},
  tests = [],
  cancelHref,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: Record<string, any>;
  tests?: { id: string; title: string }[];
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Live test">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={initial.title ?? ''} />
          </div>
          <div>
            <Label htmlFor="practice_test_id">Backing mock test (optional)</Label>
            <Select id="practice_test_id" name="practice_test_id" defaultValue={initial.practice_test_id ?? ''}>
              <option value="">— none —</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={initial.category ?? 'aptitude'}>
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="scheduled_start">Starts</Label>
            <Input id="scheduled_start" name="scheduled_start" type="datetime-local" defaultValue={toLocal(initial.scheduled_start)} />
          </div>
          <div>
            <Label htmlFor="scheduled_end">Ends</Label>
            <Input id="scheduled_end" name="scheduled_end" type="datetime-local" defaultValue={toLocal(initial.scheduled_end)} />
          </div>
          <div>
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input id="duration_minutes" name="duration_minutes" type="number" min="1" defaultValue={initial.duration_minutes ?? 60} />
          </div>
          <div>
            <Label htmlFor="total_marks">Total marks</Label>
            <Input id="total_marks" name="total_marks" type="number" min="0" defaultValue={initial.total_marks ?? 0} />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={initial.status ?? 'upcoming'}>
              {LIVE_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea id="instructions" name="instructions" rows={3} defaultValue={initial.instructions ?? ''} />
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
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Schedule test' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
