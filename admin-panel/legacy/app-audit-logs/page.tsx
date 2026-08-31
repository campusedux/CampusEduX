import { createClient } from '@/lib/supabase/server';
import { Card, EmptyState, Select } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';
import { AuditDiff } from '@/app/audit-logs/AuditDiff';

export const dynamic = 'force-dynamic';

const RESOURCE_TYPES = [
  'projects',
  'coupons',
  'orders',
  'refunds',
  'reviews',
  'support_tickets',
  'user_profiles',
  'banners',
  'reward_settings',
  'feature_flags',
  'home_layout',
];

export default async function AuditLogsPage({ searchParams }: { searchParams: { resource_type?: string } }) {
  const supabase = createClient();
  let query = supabase
    .from('audit_logs')
    .select('id, action, resource_type, resource_id, old_value, new_value, created_at, user_profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (searchParams.resource_type) query = query.eq('resource_type', searchParams.resource_type);

  const { data: logs, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Audit Logs</h1>
        <p className="text-sm text-ink-muted">Every admin action, with before/after values — read-only</p>
      </div>

      <Card>
        <form className="mb-4 max-w-xs">
          <Select name="resource_type" defaultValue={searchParams.resource_type} onChange={(e) => e.target.form?.requestSubmit()}>
            <option value="">All resource types</option>
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </form>

        {!logs || logs.length === 0 ? (
          <EmptyState title="No matching audit log entries" />
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log: any) => (
              <li key={log.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-medium text-ink">{log.action}</span>
                    <span className="ml-2 text-xs text-ink-faint">
                      {log.user_profiles?.full_name || log.user_profiles?.email || 'System'} · {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <span className="text-xs text-ink-faint">
                    {log.resource_type}
                    {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ''}
                  </span>
                </div>
                {log.old_value || log.new_value ? (
                  <AuditDiff oldValue={log.old_value} newValue={log.new_value} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
