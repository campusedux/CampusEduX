import Link from 'next/link';
import { ArrowLeft, Plus, Building2 } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDate, formatNumber } from '@/lib/utils';
import { listCompanies, COMPANY_PAGE_SIZE } from '@/lib/jobs/queries';
import { deleteCompany } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Companies · CampusEduX Admin' };

export default async function CompaniesPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const admin = await requireModule('jobs');
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { rows, total, missing } = await listCompanies({ page, q });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jobs" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Jobs
        </Link>
        <PageHeader
          title="Companies"
          subtitle="Employers that post jobs on the platform."
          action={
            admin.perms.jobs.add ? (
              <Link href="/jobs/companies/new">
                <Button>
                  <Plus size={16} /> Add Company
                </Button>
              </Link>
            ) : null
          }
        />
      </div>

      <SearchFilterBar placeholder="Search companies…" />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No companies found" description={missing ? 'The companies table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Website</th>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Open jobs</th>
                  <th className="pb-2 font-medium">Rating</th>
                  <th className="pb-2 font-medium">Added</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c: any) => (
                  <tr key={c.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        {c.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logo_url} alt="" className="h-8 w-8 rounded object-contain" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded bg-surface-subtle text-ink-faint">
                            <Building2 size={15} />
                          </span>
                        )}
                        <Link href={`/jobs/companies/${c.id}`} className="font-medium text-ink hover:text-brand">
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink-muted">
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                          Link
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 text-ink-muted">{c.employee_count || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{formatNumber(c.open_jobs_count)}</td>
                    <td className="py-2.5 text-ink-muted">
                      {Number(c.rating).toFixed(1)} ({c.review_count})
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDate(c.created_at)}</td>
                    <td className="py-2.5">
                      <RowActions
                        viewHref={`/jobs/companies/${c.id}`}
                        editHref={admin.perms.jobs.edit ? `/jobs/companies/${c.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.jobs.delete ? (
                            <DeleteButton action={deleteCompany.bind(null, c.id)} confirmMessage={`Delete "${c.name}"?`} />
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
          <Pagination page={page} pageSize={COMPANY_PAGE_SIZE} total={total} basePath="/jobs/companies" searchParams={{ q }} />
        </div>
      </Card>
    </div>
  );
}
