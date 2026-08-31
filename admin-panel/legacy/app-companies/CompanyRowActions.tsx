'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCompany } from '@/app/companies/actions';

export function CompanyRowActions({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm('Delete this company? Jobs linking to it will keep their name/logo but lose the profile page.')) return;
          startTransition(async () => {
            await deleteCompany(companyId);
            router.refresh();
          });
        }}
        className="text-danger hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
