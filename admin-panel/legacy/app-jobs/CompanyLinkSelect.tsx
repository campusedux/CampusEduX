'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/primitives';
import { updateJobCompany } from '@/app/jobs/actions';

export function CompanyLinkSelect({
  jobId,
  companyId,
  companies,
}: {
  jobId: string;
  companyId: string | null;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={companyId ?? ''}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value || null;
        startTransition(async () => {
          await updateJobCompany(jobId, value);
          router.refresh();
        });
      }}
      className="h-8 text-xs"
    >
      <option value="">Not linked</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </Select>
  );
}
