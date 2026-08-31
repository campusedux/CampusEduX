import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, EmptyState, Badge } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';
import { MODULES, MODULE_LABEL } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Activity Logs · CampusEduX Admin' };

const PAGE_SIZE = 25;

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; module?: string };
}) {
  await requireModule('dashboard');
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const mod = searchParams.module ?? '';
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('admin_activity_logs')
    .select('id, actor_email, action, module, resource_type, resource_id, details, ip_address, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (mod) query = query.eq('module', mod);
  if (q) query = query.or(`action.ilike.%${q}%,actor_email.ilike.%${q}%,resource_type.ilike.%${q}%,resource_id.ilike.%${q}%`);

  const { data, count, error } = await query;
  const rows = error ? [] : (data ?? []);
  const total = error ? 0 : count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" subtitle="Audit trail of every action staff take in the panel." />

      <SearchFilterBar
        placeholder="Search action, admin email or resource…"
        filters={
          <FilterSelect
            name="module"
            label="Module"
            options={MODULES.map((m) => ({ value: m, label: MODULE_LABEL[m] }))}
          />
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description={
              error
                ? 'The admin_activity_logs table isn’t available — apply admin-panel migration 001.'
                : 'Actions staff take (create, edit, approve, delete) are recorded here.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Admin</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Resource</th>
                  <th className="pb-2 font-medium">IP</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border align-top odd:bg-surface-subtle/40">
                    <td className="py-2.5 text-ink-muted">{r.actor_email || '—'}</td>
                    <td className="py-2.5">
                      <span className="font-mono text-[13px] text-ink">{r.action}</span>
                      {r.module ? <Badge label={r.module} tone="neutral" /> : null}
                    </td>
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
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/activity-logs" searchParams={{ q, module: mod }} />
        </div>
      </Card>
    </div>
  );
}
