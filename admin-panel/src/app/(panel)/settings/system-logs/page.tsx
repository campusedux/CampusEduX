import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';
import { MODULES, MODULE_LABEL } from '@/lib/permissions';
import { listSystemLogs, LOG_PAGE_SIZE } from '@/lib/settings/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'System Logs · CampusEduX Admin' };

export default async function SystemLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; module?: string };
}) {
  await requireModule('system_logs');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const mod = searchParams.module ?? '';
  const { rows, total, missing } = await listSystemLogs({ page, q, module: mod });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader title="System Logs" subtitle="Full audit trail of staff actions — user, action, module, IP and time." />
      </div>

      <SearchFilterBar
        placeholder="Search action, admin email or resource…"
        filters={<FilterSelect name="module" label="Module" options={MODULES.map((m) => ({ value: m, label: MODULE_LABEL[m] }))} />}
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No log entries"
            description={missing ? 'The admin_activity_logs table isn’t available — apply admin migration 001.' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Admin</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Module</th>
                  <th className="pb-2 font-medium">Resource</th>
                  <th className="pb-2 font-medium">IP</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5 text-ink-muted">{r.actor_email || '—'}</td>
                    <td className="py-2.5 font-mono text-[13px] text-ink">{r.action}</td>
                    <td className="py-2.5">{r.module ? <Badge label={r.module} tone="neutral" /> : '—'}</td>
                    <td className="py-2.5 text-ink-muted">
                      {r.resource_type ? `${r.resource_type}${r.resource_id ? ` · ${r.resource_id}` : ''}` : '—'}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-ink-faint">{r.ip_address || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={LOG_PAGE_SIZE} total={total} basePath="/settings/system-logs" searchParams={{ q, module: mod }} />
        </div>
      </Card>
    </div>
  );
}
