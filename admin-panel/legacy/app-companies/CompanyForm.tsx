'use client';

import { useState, useTransition } from 'react';
import { Label, Input, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createCompany, type CompanyFormValues } from '@/app/companies/actions';

export function CompanyForm() {
  const [values, setValues] = useState<CompanyFormValues>({
    name: '',
    logoUrl: null,
    description: null,
    website: null,
    industry: null,
    hqLocation: null,
    companySize: null,
    foundedYear: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!values.name.trim()) return setError('Company name is required.');
    setError(null);
    startTransition(async () => {
      try {
        await createCompany(values);
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
          <Label>Company name</Label>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="Google" />
        </div>
        <div>
          <Label>Logo URL (optional)</Label>
          <Input value={values.logoUrl ?? ''} onChange={(e) => set('logoUrl', e.target.value || null)} />
        </div>
        <div>
          <Label>Website (optional)</Label>
          <Input value={values.website ?? ''} onChange={(e) => set('website', e.target.value || null)} placeholder="https://..." />
        </div>
        <div>
          <Label>Industry (optional)</Label>
          <Input value={values.industry ?? ''} onChange={(e) => set('industry', e.target.value || null)} />
        </div>
        <div>
          <Label>HQ location (optional)</Label>
          <Input value={values.hqLocation ?? ''} onChange={(e) => set('hqLocation', e.target.value || null)} />
        </div>
        <div>
          <Label>Company size (optional)</Label>
          <Input value={values.companySize ?? ''} onChange={(e) => set('companySize', e.target.value || null)} placeholder="1000-5000 employees" />
        </div>
        <div>
          <Label>Founded year (optional)</Label>
          <Input
            type="number"
            value={values.foundedYear ?? ''}
            onChange={(e) => set('foundedYear', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="col-span-2">
          <Label>Description (optional)</Label>
          <Textarea rows={4} value={values.description ?? ''} onChange={(e) => set('description', e.target.value || null)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : 'Create company'}
        </Button>
      </div>
    </div>
  );
}
