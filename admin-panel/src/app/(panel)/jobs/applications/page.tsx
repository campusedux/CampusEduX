import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { ApplicationsTable } from '../ApplicationsTable';
import { listApplications, APPLICATION_PAGE_SIZE } from '@/lib/jobs/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Applications · CampusEduX Admin' };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; job?: string };
}) {
  await requireModule('jobs');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';
  const job = searchParams.job ?? '';

  const { rows, total, missing } = await listApplications({ page, q, status, job });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jobs" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Jobs
        </Link>
        <PageHeader title="Applications" subtitle="Every applicant across all jobs." />
      </div>

      <SearchFilterBar
        placeholder="Search applicant name or email…"
        filters={
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: 'in_review', label: 'New' },
              { value: 'shortlisted', label: 'Shortlisted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'hired', label: 'Hired' },
            ]}
          />
        }
      />

      <ApplicationsTable
        rows={rows as any}
        total={total}
        page={page}
        pageSize={APPLICATION_PAGE_SIZE}
        basePath="/jobs/applications"
        searchParams={{ q, status, job }}
        missing={missing}
      />
    </div>
  );
}
