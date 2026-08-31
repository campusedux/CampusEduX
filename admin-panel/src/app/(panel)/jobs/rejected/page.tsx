import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { ApplicationsTable } from '../ApplicationsTable';
import { listApplications, APPLICATION_PAGE_SIZE } from '@/lib/jobs/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rejected Candidates · CampusEduX Admin' };

export default async function RejectedPage({ searchParams }: { searchParams: { page?: string; q?: string } }) {
  await requireModule('jobs');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const { rows, total, missing } = await listApplications({ page, q, status: 'rejected' });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jobs" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Jobs
        </Link>
        <PageHeader title="Rejected Candidates" subtitle="Applicants not moved forward, with the reason on record." />
      </div>
      <SearchFilterBar placeholder="Search applicant…" />
      <ApplicationsTable
        rows={rows as any}
        total={total}
        page={page}
        pageSize={APPLICATION_PAGE_SIZE}
        basePath="/jobs/rejected"
        searchParams={{ q }}
        showReason
        missing={missing}
      />
    </div>
  );
}
