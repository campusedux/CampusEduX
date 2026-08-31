import Link from 'next/link';
import { Plus, Briefcase, DoorOpen, Star, Users, Trophy } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDate, formatNumber } from '@/lib/utils';
import { listJobs, getJobStats, getCompanyOptions, JOB_PAGE_SIZE, JOB_TYPES } from '@/lib/jobs/queries';
import { deleteJob } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Jobs · CampusEduX Admin' };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; company?: string; type?: string; status?: string; targeting?: string };
}) {
  const admin = await requireModule('jobs');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const company = searchParams.company ?? '';
  const type = searchParams.type ?? '';
  const status = searchParams.status ?? '';
  const targeting = searchParams.targeting ?? '';

  const [{ rows, total, missing }, stats, companies] = await Promise.all([
    listJobs({ page, q, company, type, status, targeting }),
    getJobStats(),
    getCompanyOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        subtitle="Job listings students browse and apply to."
        action={
          <div className="flex gap-2">
            <Link href="/jobs/companies">
              <Button variant="secondary">Companies</Button>
            </Link>
            <Link href="/jobs/applications">
              <Button variant="secondary">Applications</Button>
            </Link>
            {admin.perms.jobs.add ? (
              <Link href="/jobs/new">
                <Button>
                  <Plus size={16} /> Add Job
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <SearchFilterBar
        placeholder="Search jobs by title, company or location…"
        filters={
          <>
            <FilterSelect name="company" label="Company" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
            <FilterSelect name="type" label="Type" options={JOB_TYPES.map((t) => ({ value: t, label: t }))} />
            <FilterSelect
              name="status"
              label="Status"
              options={[
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
            <FilterSelect
              name="targeting"
              label="Audience"
              options={[
                { value: 'global', label: 'Global' },
                { value: 'course', label: 'Course-wide' },
                { value: 'branch', label: 'Branch-specific' },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total jobs" value={formatNumber(stats.total)} icon={Briefcase} />
        <StatCard label="Open" value={formatNumber(stats.open)} icon={DoorOpen} tone="success" />
        <StatCard label="Featured" value={formatNumber(stats.featured)} icon={Star} tone="info" />
        <StatCard label="Applications" value={formatNumber(stats.apps)} icon={Users} tone="brand" />
        <StatCard label="Hires" value={formatNumber(stats.hires)} icon={Trophy} tone="warning" />
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description={missing ? 'The jobs table isn’t available yet — apply the mobile migrations.' : 'Try a different search or filter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Job</th>
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Location</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Salary</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Posted</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => (
                  <tr key={j.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <Link href={`/jobs/${j.id}`} className="font-medium text-ink hover:text-brand">
                        {j.title}
                      </Link>
                      {j.is_featured ? <Badge label="Featured" tone="info" /> : null}
                    </td>
                    <td className="py-2.5 text-ink-muted">{j.company_name || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{j.location || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{j.job_type}</td>
                    <td className="py-2.5 text-ink-muted">{j.salary_range || '—'}</td>
                    <td className="py-2.5">
                      <StatusPill status={j.status ?? 'open'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDate(j.posted_at)}</td>
                    <td className="py-2.5">
                      <RowActions
                        viewHref={`/jobs/${j.id}`}
                        editHref={admin.perms.jobs.edit ? `/jobs/${j.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.jobs.delete ? (
                            <DeleteButton action={deleteJob.bind(null, j.id)} confirmMessage={`Delete "${j.title}"?`} />
                          ) : null
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination
            page={page}
            pageSize={JOB_PAGE_SIZE}
            total={total}
            basePath="/jobs"
            searchParams={{ q, company, type, status, targeting }}
          />
        </div>
      </Card>
    </div>
  );
}
