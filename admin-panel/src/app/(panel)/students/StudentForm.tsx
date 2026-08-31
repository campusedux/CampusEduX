'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export interface StudentFormInitial {
  full_name?: string;
  email?: string;
  mobile_number?: string;
  course?: string | null;
  branch?: string | null;
  year?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  location?: string | null;
  admin_notes?: string | null;
  is_premium?: boolean;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Passed Out'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export function StudentForm({
  mode,
  action,
  initial = {},
  cancelHref,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: StudentFormInitial;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Account" description={mode === 'create' ? 'Login details for the new student.' : 'Contact details.'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required defaultValue={initial.full_name ?? ''} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required={mode === 'create'}
              defaultValue={initial.email ?? ''}
              readOnly={mode === 'edit'}
              className={mode === 'edit' ? 'bg-surface-subtle' : undefined}
            />
            {mode === 'edit' ? (
              <p className="mt-1 text-xs text-ink-faint">Email is managed by the student from their app.</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="mobile_number">Phone</Label>
            <Input id="mobile_number" name="mobile_number" defaultValue={initial.mobile_number ?? ''} />
          </div>
          {mode === 'create' ? (
            <div>
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" type="text" required minLength={8} placeholder="min 8 characters" />
              <p className="mt-1 text-xs text-ink-faint">The student can reset it from the app.</p>
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Academic Information" description="Used to personalise what the student sees.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="course">Course</Label>
            <Input id="course" name="course" defaultValue={initial.course ?? ''} placeholder="B.Tech, BCA…" />
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" name="branch" defaultValue={initial.branch ?? ''} placeholder="CSE, ECE…" />
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Select id="year" name="year" defaultValue={initial.year ?? ''}>
              <option value="">—</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={initial.location ?? ''} placeholder="City" />
          </div>
        </div>
      </Section>

      <Section title="Personal Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" name="gender" defaultValue={initial.gender ?? ''}>
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of birth</Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={initial.date_of_birth ?? ''} />
          </div>
          {mode === 'create' ? (
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
              <input type="checkbox" name="is_premium" defaultChecked={initial.is_premium} className="h-4 w-4 rounded border-border text-brand" />
              Grant premium
            </label>
          ) : (
            <div className="sm:col-span-2">
              <Label htmlFor="admin_notes">Admin notes</Label>
              <Textarea id="admin_notes" name="admin_notes" rows={3} defaultValue={initial.admin_notes ?? ''} />
            </div>
          )}
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
        >
          Cancel
        </Link>
        <div className="w-32">
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create student' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
