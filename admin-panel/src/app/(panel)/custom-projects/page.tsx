import Link from 'next/link';
import { Hammer, Wrench, FlaskConical, PackageCheck, IndianRupee, Bell } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { formatINR, formatDate, formatNumber } from '@/lib/utils';
import { listCustomRequests, getCustomRequestStats, getAdminInbox } from '@/lib/custom-projects/queries';
import {
  CUSTOM_PROJECTS_PAGE_SIZE,
  CUSTOM_PROJECT_STATUSES,
  CUSTOM_STATUS_LABEL,
  PLATFORM_LABEL,
  PROJECT_TYPES,
} from '@/lib/custom-projects/constants';
import { markInboxRead } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Custom Projects · CampusEduX Admin' };

export default async function CustomProjectsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; type?: string };
}) {
  const admin = await requireModule('custom_projects');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';
  const type = searchParams.type ?? '';

  const [{ rows, total, missing }, stats, inbox] = await Promise.all([
    listCustomRequests({ page, q, status, type }),
    getCustomRequestStats(),
    getAdminInbox(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Projects"
        subtitle="Paid custom-project requests from the mobile builder. No approval step — the token is already paid."
        action={
          <div className="flex gap-2">
            <Link href="/custom-projects/features">
              <Button variant="secondary">Feature catalog</Button>
            </Link>
            <Link href="/custom-projects/pricing">
              <Button variant="secondary">Pricing</Button>
            </Link>
          </div>
        }
      />

      {inbox.unread > 0 ? (
        <Card className="border-brand/30 bg-brand-light/40">
          <details>
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-dark">
              <Bell size={16} /> {inbox.unread} new paid request{inbox.unread === 1 ? '' : 's'}
            </summary>
            <ul className="mt-3 space-y-2">
              {inbox.recent
                .filter((n) => !n.is_read)
                .map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{n.title}</p>
                      <p className="truncate text-ink-muted">{n.body}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {n.request_id ? (
                        <Link href={`/custom-projects/${n.request_id}`} className="text-brand hover:underline">
                          Open
                        </Link>
                      ) : null}
                      <form action={markInboxRead.bind(null, n.id)}>
                        <button className="text-ink-faint hover:text-ink">Mark read</button>
                      </form>
                    </div>
                  </li>
                ))}
            </ul>
          </details>
        </Card>
      ) : null}

      <SearchFilterBar
        placeholder="Search by title or request code…"
        filters={
          <>
            <FilterSelect
              name="status"
              label="Status"
              options={CUSTOM_PROJECT_STATUSES.map((s) => ({ value: s, label: CUSTOM_STATUS_LABEL[s] }))}
            />
            <FilterSelect
              name="type"
              label="Type"
              options={PROJECT_TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total requests" value={formatNumber(stats.total)} icon={Hammer} />
        <StatCard label="In development" value={formatNumber(stats.inDev)} icon={Wrench} tone="info" />
        <StatCard label="Testing" value={formatNumber(stats.testing)} icon={FlaskConical} tone="warning" />
        <StatCard label="Delivered" value={formatNumber(stats.delivered)} icon={PackageCheck} tone="success" />
        <StatCard label="Token revenue" value={formatINR(stats.tokenRevenue)} icon={IndianRupee} tone="brand" />
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No custom project requests"
            description={
              missing
                ? 'The custom_project_requests table isn’t available yet — apply migration 0033 + 013.'
                : 'Paid requests from the mobile Custom Project Builder will appear here.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Request</th>
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Type · Level</th>
                  <th className="pb-2 font-medium">Platform</th>
                  <th className="pb-2 font-medium">Estimate</th>
                  <th className="pb-2 font-medium">Token</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <Link href={`/custom-projects/${r.id}`} className="font-medium text-ink hover:text-brand">
                        {r.title}
                      </Link>
                      <p className="font-mono text-xs text-ink-faint">{r.request_code}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">
                      {r.profile?.full_name || '—'}
                      <p className="text-xs text-ink-faint">{r.profile?.email}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">
                      {r.project_type[0].toUpperCase() + r.project_type.slice(1)} · {r.project_level}
                    </td>
                    <td className="py-2.5 text-ink-muted">{PLATFORM_LABEL[r.platform] ?? r.platform}</td>
                    <td className="py-2.5 font-mono">{formatINR(Number(r.estimated_total))}</td>
                    <td className="py-2.5 font-mono">{formatINR(Number(r.token_amount))}</td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDate(r.created_at)}</td>
                    <td className="py-2.5">
                      <RowActions viewHref={`/custom-projects/${r.id}`} />
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
            pageSize={CUSTOM_PROJECTS_PAGE_SIZE}
            total={total}
            basePath="/custom-projects"
            searchParams={{ q, status, type }}
          />
        </div>
      </Card>
    </div>
  );
}
