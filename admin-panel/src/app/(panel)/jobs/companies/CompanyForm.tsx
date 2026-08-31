'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export interface CompanyFormInitial {
  name?: string;
  logo_url?: string | null;
  website?: string | null;
  employee_count?: string;
  about?: string;
}

export function CompanyForm({
  mode,
  action,
  initial = {},
  cancelHref,
  companyId,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: CompanyFormInitial;
  cancelHref: string;
  companyId?: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Company">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={initial.name ?? ''} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" defaultValue={initial.website ?? ''} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="employee_count">Employee count</Label>
            <Input id="employee_count" name="employee_count" defaultValue={initial.employee_count ?? ''} placeholder="51–200" />
          </div>
          <div className="sm:col-span-2">
            <Label>Company logo</Label>
            <ImageUploader
              name="logo_url"
              bucket="project-media"
              pathPrefix={companyId ? `company-logos/${companyId}` : 'company-logos'}
              defaultValue={initial.logo_url ?? ''}
              aspect="square"
              helpText="Shown on job cards · JPG, PNG or WebP"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="about">About</Label>
            <Textarea id="about" name="about" rows={4} defaultValue={initial.about ?? ''} />
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
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create company' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
