import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, Building2 } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { getCompany, getCompanyRecruiters } from '@/lib/jobs/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, StatusPill, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { FlashToast } from '@/components/ui/FlashToast';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDate, formatNumber } from '@/lib/utils';
import { RecruiterManager } from './RecruiterManager';
import { deleteCompany } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Company Details · CampusEduX Admin' };

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'about', label: 'About' },
  { value: 'contact', label: 'Contact' },
];

async function CompanyJobsTab({ companyId }: { companyId: string }) {
  const supabase = createClient();
  const jobs = await safe(
    supabase
      .from('jobs')
      .select('id, title, location, job_type, status, posted_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    [] as any[],
  );
  return (
    <Card>
      <CardHeader title={`Jobs (${jobs.length})`} />
      {jobs.length === 0 ? (
        <EmptyState title="No jobs from this company" />
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {jobs.map((j: any) => (
              <tr key={j.id} className="border-t border-border first:border-0">
                <td className="py-2.5">
                  <Link href={`/jobs/${j.id}`} className="font-medium text-ink hover:text-brand">
                    {j.title}
                  </Link>
                </td>
                <td className="py-2.5 text-ink-muted">{j.location || '—'}</td>
                <td className="py-2.5 text-ink-muted">{j.job_type}</td>
                <td className="py-2.5">
                  <StatusPill status={j.status ?? 'open'} />
                </td>
                <td className="py-2.5 text-ink-muted">{formatDate(j.posted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; created?: string; saved?: string };
}) {
  const admin = await requireModule('jobs');
  const company = await getCompany(params.id);
  if (!company) notFound();
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : 'overview';

  return (
    <div className="space-y-5">
      {searchParams.created ? <FlashToast title="Company created" /> : null}
      {searchParams.saved ? <FlashToast title="Changes saved" /> : null}

      <div>
        <Link href="/jobs/companies" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Companies
        </Link>
        <PageHeader
          title={company.name}
          subtitle={[company.employee_count, company.website].filter(Boolean).join(' · ') || 'Employer'}
          action={
            <div className="flex items-center gap-2">
              {admin.perms.jobs.edit ? (
                <Link
                  href={`/jobs/companies/${company.id}/edit`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
                >
                  <Pencil size={14} /> Edit
                </Link>
              ) : null}
              {admin.perms.jobs.delete ? (
                <DeleteButton
                  action={deleteCompany.bind(null, company.id)}
                  confirmMessage={`Delete "${company.name}"?`}
                  label="Delete"
                  redirectTo="/jobs/companies"
                />
              ) : null}
            </div>
          }
        />
      </div>

      <Tabs basePath={`/jobs/companies/${company.id}`} current={tab} tabs={TABS} />

      {tab === 'overview' ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Open jobs" value={formatNumber(company.open_jobs_count)} icon={Building2} />
          <StatCard label="Rating" value={`${Number(company.rating).toFixed(1)}`} tone="warning" />
          <StatCard label="Reviews" value={formatNumber(company.review_count)} tone="info" />
          <StatCard label="Added" value={formatDate(company.created_at)} />
        </div>
      ) : null}

      {tab === 'jobs' ? <CompanyJobsTab companyId={company.id} /> : null}

      {tab === 'about' ? (
        <Card>
          <CardHeader title="About" />
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{company.about || 'No description yet.'}</p>
        </Card>
      ) : null}

      {tab === 'contact' ? (
        <RecruiterManager
          companyId={company.id}
          recruiters={await getCompanyRecruiters(company.id)}
          canEdit={admin.perms.jobs.edit}
        />
      ) : null}
    </div>
  );
}
