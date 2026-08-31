'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import type { AcademicOptions } from '@/lib/academic-targeting';
import { JOB_TYPES } from '@/lib/jobs/constants';

type Result = { ok: boolean; error?: string };

export interface JobFormInitial {
  title?: string;
  company_id?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  location?: string;
  salary_range?: string;
  salary_min_lpa?: number | null;
  salary_max_lpa?: number | null;
  job_type?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  experience?: string;
  status?: string | null;
  target_type?: string | null;
  target_course_id?: string | null;
  target_branch_ids?: string[] | null;
  target_year_id?: string | null;
}

export function JobForm({
  mode,
  action,
  initial = {},
  companies,
  academicOptions,
  cancelHref,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: JobFormInitial;
  companies: { id: string; name: string }[];
  academicOptions: AcademicOptions;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Job title</Label>
            <Input id="title" name="title" required defaultValue={initial.title ?? ''} />
          </div>
          <div>
            <Label htmlFor="company_id">Company</Label>
            <Select id="company_id" name="company_id" defaultValue={initial.company_id ?? ''}>
              <option value="">— pick or type below —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="company_name">Company name (if not listed)</Label>
            <Input id="company_name" name="company_name" defaultValue={initial.company_name ?? ''} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={initial.location ?? ''} placeholder="Bengaluru / Remote" />
          </div>
          <div>
            <Label htmlFor="job_type">Type</Label>
            <Select id="job_type" name="job_type" defaultValue={initial.job_type ?? 'Full Time'}>
              {JOB_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={initial.status ?? 'open'}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="experience">Experience</Label>
            <Input id="experience" name="experience" defaultValue={initial.experience ?? ''} placeholder="0–2 years" />
          </div>
        </div>
      </Section>

      <Section title="Compensation">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="salary_range">Salary range (display)</Label>
            <Input id="salary_range" name="salary_range" defaultValue={initial.salary_range ?? ''} placeholder="₹6–10 LPA" />
          </div>
          <div>
            <Label htmlFor="salary_min_lpa">Min LPA</Label>
            <Input id="salary_min_lpa" name="salary_min_lpa" type="number" step="0.5" defaultValue={initial.salary_min_lpa ?? ''} />
          </div>
          <div>
            <Label htmlFor="salary_max_lpa">Max LPA</Label>
            <Input id="salary_max_lpa" name="salary_max_lpa" type="number" step="0.5" defaultValue={initial.salary_max_lpa ?? ''} />
          </div>
        </div>
      </Section>

      <Section title="Details">
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={initial.description ?? ''} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea id="requirements" name="requirements" rows={4} defaultValue={(initial.requirements ?? []).join('\n')} />
            </div>
            <div>
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Textarea id="skills" name="skills" rows={4} defaultValue={(initial.skills ?? []).join(', ')} />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Academic targeting"
        description="Global stays open to everyone. A course-wide job is ranked up for that course. A branch job is only shown to the branches you pick."
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

      <div className="flex items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
        >
          Cancel
        </Link>
        <div className="w-32">
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create job' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
