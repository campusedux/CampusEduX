import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { ExportButton } from '@/components/ui/ExportButton';
import { formatINR, formatNumber, formatDate } from '@/lib/utils';
import { ShoppingCart, IndianRupee, Download, ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Report · CampusEduX Admin' };

function defaultRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(Date.now() - 29 * 86_400_000);
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export default async function StudentReportPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createClient();
  const { startIso, endIso } = defaultRange(searchParams.from, searchParams.to);

  const [orders, downloads, tests] = await Promise.all([
    safe(
      supabase
        .from('purchases')
        .select('total_amount, status, created_at, project:projects(title)')
        .eq('user_id', params.id)
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      [] as any[],
    ),
    safe(
      supabase
        .from('downloads')
        .select('file_label, file_size_mb, downloaded_at')
        .eq('user_id', params.id)
        .gte('downloaded_at', startIso)
        .lte('downloaded_at', endIso),
      [] as any[],
    ),
    safe(
      supabase
        .from('test_attempts')
        .select('score, total_marks, created_at, test:practice_tests(title)')
        .eq('user_id', params.id)
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      [] as any[],
    ),
  ]);

  const okOrders = orders.filter((o) => o.status === 'success');
  const spend = okOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

  const exportRows = [
    ...okOrders.map((o) => ({ type: 'order', item: o.project?.title ?? '', amount: o.total_amount, date: o.created_at })),
    ...downloads.map((d) => ({ type: 'download', item: d.file_label, amount: `${d.file_size_mb} MB`, date: d.downloaded_at })),
    ...tests.map((t) => ({ type: 'test', item: t.test?.title ?? '', amount: `${t.score}/${t.total_marks}`, date: t.created_at })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Student report"
        subtitle={`${formatDate(startIso)} – ${formatDate(endIso)}`}
        action={<ExportButton rows={exportRows} filename={`student-${params.id}-report`} label="Export Report" />}
      />

      <Card>
        <CardHeader title="Date range" />
        <DateRangePicker />
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={formatNumber(okOrders.length)} icon={ShoppingCart} />
        <StatCard label="Spend" value={formatINR(spend)} icon={IndianRupee} tone="success" />
        <StatCard label="Downloads" value={formatNumber(downloads.length)} icon={Download} tone="info" />
        <StatCard label="Tests attempted" value={formatNumber(tests.length)} icon={ClipboardList} tone="brand" />
      </div>

      <Card>
        <CardHeader title="Activity in range" />
        {exportRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">No activity in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {exportRows
                  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                  .map((r, i) => (
                    <tr key={i} className="border-t border-border odd:bg-surface-subtle/40">
                      <td className="py-2 capitalize text-ink-muted">{r.type}</td>
                      <td className="py-2 text-ink">{r.item || '—'}</td>
                      <td className="py-2 font-mono text-ink-muted">
                        {typeof r.amount === 'number' ? formatINR(r.amount) : r.amount}
                      </td>
                      <td className="py-2 text-ink-muted">{formatDate(r.date)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
