'use client';

import { useState, useTransition } from 'react';
import { Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createJob, type JobFormValues } from '@/app/jobs/actions';

export function JobForm({ companies }: { companies: { id: string; name: string; logo_url: string | null }[] }) {
  const [values, setValues] = useState<Omit<JobFormValues, 'skills'> & { skillsInput: string }>({
    title: '',
    companyId: null,
    companyName: '',
    companyLogoUrl: null,
    location: '',
    jobType: 'full_time',
    experienceMinYears: 0,
    experienceMaxYears: null,
    salaryMinLpa: null,
    salaryMaxLpa: null,
    skillsInput: '',
    description: null,
    applyUrl: null,
    isFeatured: false,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!values.title.trim()) return setError('Job title is required.');
    if (!values.companyName.trim()) return setError('Company name is required.');
    if (!values.location.trim()) return setError('Location is required.');
    setError(null);

    const skills = values.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        await createJob({ ...values, skills });
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Job title</Label>
          <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="Software Engineer" />
        </div>
        <div className="col-span-2">
          <Label>Link to company profile (optional, but required for &quot;View Company&quot; to work in the app)</Label>
          <Select
            value={values.companyId ?? ''}
            onChange={(e) => {
              const companyId = e.target.value || null;
              const company = companies.find((c) => c.id === companyId);
              setValues((prev) => ({
                ...prev,
                companyId,
                companyName: company ? company.name : prev.companyName,
                companyLogoUrl: company ? company.logo_url : prev.companyLogoUrl,
              }));
            }}
          >
            <option value="">— Not linked (company name below is just text) —</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
          {companies.length === 0 ? (
            <p className="mt-1 text-xs text-ink-faint">
              No company profiles yet — add one under Companies first if you want this job linked to a full profile.
            </p>
          ) : null}
        </div>

        <div>
          <Label>Company name</Label>
          <Input value={values.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Google" />
        </div>

        <div>
          <Label>Location</Label>
          <Input value={values.location} onChange={(e) => set('location', e.target.value)} placeholder="Bangalore, India" />
        </div>
        <div>
          <Label>Job type</Label>
          <Select value={values.jobType} onChange={(e) => set('jobType', e.target.value as JobFormValues['jobType'])}>
            <option value="full_time">Full-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </Select>
        </div>

        <div>
          <Label>Experience min (years)</Label>
          <Input
            type="number"
            value={values.experienceMinYears}
            onChange={(e) => set('experienceMinYears', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Experience max (years, optional)</Label>
          <Input
            type="number"
            value={values.experienceMaxYears ?? ''}
            onChange={(e) => set('experienceMaxYears', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <Label>Salary min (LPA, optional)</Label>
          <Input
            type="number"
            value={values.salaryMinLpa ?? ''}
            onChange={(e) => set('salaryMinLpa', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div>
          <Label>Salary max (LPA, optional)</Label>
          <Input
            type="number"
            value={values.salaryMaxLpa ?? ''}
            onChange={(e) => set('salaryMaxLpa', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div className="col-span-2">
          <Label>Skills (comma separated)</Label>
          <Input value={values.skillsInput} onChange={(e) => set('skillsInput', e.target.value)} placeholder="Java, DSA, Spring Boot" />
        </div>

        <div className="col-span-2">
          <Label>Description (optional)</Label>
          <Textarea rows={4} value={values.description ?? ''} onChange={(e) => set('description', e.target.value || null)} />
        </div>

        <div className="col-span-2">
          <Label>Apply URL (optional)</Label>
          <Input value={values.applyUrl ?? ''} onChange={(e) => set('applyUrl', e.target.value || null)} placeholder="https://..." />
        </div>

        <div className="flex items-center gap-4 pb-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : 'Create job'}
        </Button>
      </div>
    </div>
  );
}
