'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { AcademicTargetingFields } from '@/components/ui/AcademicTargetingFields';
import type { AcademicOptions } from '@/lib/academic-targeting';
import { JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS, JOB_CATEGORIES } from '@/lib/jobs/constants';

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
  apply_url?: string | null;
  application_deadline?: string | null;
  requisition_id?: string | null;
  category?: string | null;
  work_mode?: string | null;
  experience_level?: string | null;
  qualification?: string | null;
  shift?: string | null;
  benefits?: string[] | null;
  summary?: string | null;
  responsibilities?: string[] | null;
  candidate_note?: string | null;
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
            <Label htmlFor="work_mode">Work mode{mode === 'create' ? ' *' : ''}</Label>
            <Select id="work_mode" name="work_mode" required={mode === 'create'} defaultValue={initial.work_mode ?? ''}>
              <option value="">— select —</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="experience_level">Experience level{mode === 'create' ? ' *' : ''}</Label>
            <Select id="experience_level" name="experience_level" required={mode === 'create'} defaultValue={initial.experience_level ?? ''}>
              <option value="">— select —</option>
              {EXPERIENCE_LEVELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
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

      <Section title="Apply & listing details" description="Set an apply link to send candidates to the employer's site (opens outside the app). Leave blank to keep the in-app resume application.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="apply_url">Apply URL</Label>
            <Input id="apply_url" name="apply_url" type="url" defaultValue={initial.apply_url ?? ''} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="application_deadline">Deadline (closes end of this day, IST)</Label>
            <Input
              id="application_deadline"
              name="application_deadline"
              type="date"
              defaultValue={
                initial.application_deadline
                  ? new Date(initial.application_deadline).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
                  : ''
              }
            />
          </div>
          <div>
            <Label htmlFor="requisition_id">Requisition ID</Label>
            <Input id="requisition_id" name="requisition_id" defaultValue={initial.requisition_id ?? ''} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={initial.category ?? ''}>
              <option value="">Auto-detect from title &amp; skills</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="qualification">Qualification</Label>
            <Input id="qualification" name="qualification" defaultValue={initial.qualification ?? ''} />
          </div>
          <div>
            <Label htmlFor="shift">Shift</Label>
            <Input id="shift" name="shift" defaultValue={initial.shift ?? ''} />
          </div>
          <div>
            <Label htmlFor="benefits">Benefits (comma separated)</Label>
            <Input id="benefits" name="benefits" defaultValue={(initial.benefits ?? []).join(', ')} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="summary">Short summary (job cards)</Label>
            <Textarea id="summary" name="summary" rows={2} defaultValue={initial.summary ?? ''} />
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
          <div>
            <Label htmlFor="responsibilities">What you&apos;ll work on (one per line)</Label>
            <Textarea id="responsibilities" name="responsibilities" rows={5} defaultValue={(initial.responsibilities ?? []).join('\n')} />
          </div>
          <div>
            <Label htmlFor="candidate_note">Note for candidates</Label>
            <Textarea id="candidate_note" name="candidate_note" rows={2} defaultValue={initial.candidate_note ?? ''} />
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
