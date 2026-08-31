import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { IndianRupee, Receipt, TrendingUp, Undo2 } from 'lucide-react';
import { safe } from '@/lib/utils';
import { formatINR, formatINRCompact } from '@/lib/utils';
import { getOverviewSeries, getOrdersByStatus } from '@/lib/dashboard/metrics';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Revenue · CampusEduX Admin' };

export default async function RevenuePage() {
  await requireModule('dashboard');
  const supabase = createClient();
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();

  const [series, byStatus, rows, topProducts] = await Promise.all([
    getOverviewSeries(30),
    getOrdersByStatus(),
    safe(
      supabase.from('purchases').select('total_amount, platform_fee, discount, status, created_at').gte('created_at', since),
      [] as { total_amount: number; platform_fee: number; discount: number; status: string }[],
    ),
    safe(
      supabase
        .from('purchases')
        .select('total_amount, project:projects(title)')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(500),
      [] as any[],
    ),
  ]);

  const ok = rows.filter((r) => r.status === 'success');
  const gross = ok.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const fees = ok.reduce((s, r) => s + (Number(r.platform_fee) || 0), 0);
  const aov = ok.length ? gross / ok.length : 0;
  const refunds = rows.filter((r) => r.status === 'failed').length;

  const productTotals = new Map<string, number>();
  for (const r of topProducts) {
    const t = r.project?.title || 'Unknown project';
    productTotals.set(t, (productTotals.get(t) ?? 0) + (Number(r.total_amount) || 0));
  }
  const top = [...productTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" subtitle="Money in, over the last 90 days." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross revenue (90d)" value={formatINRCompact(gross)} icon={IndianRupee} tone="success" />
        <StatCard label="Platform fees" value={formatINRCompact(fees)} icon={TrendingUp} />
        <StatCard label="Avg order value" value={formatINR(aov)} icon={Receipt} tone="info" />
        <StatCard label="Failed / refunded" value={String(refunds)} icon={Undo2} tone="danger" />
      </div>

      <Card>
        <CardHeader title="Revenue trend" description="Successful orders, last 30 days" />
        <TrendChart data={series} series={[{ key: 'revenue', label: 'Revenue (₹)', color: '#16A34A' }]} currency />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Orders by status" />
          <DonutChart data={byStatus} centerLabel="Orders" />
        </Card>
        <Card>
          <CardHeader title="Top selling products" description="By revenue, last 90 days" />
          {top.length === 0 ? (
            <EmptyState title="No sales yet" />
          ) : (
            <ul className="space-y-2">
              {top.map(([title, amount], i) => (
                <li key={title} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                    {title}
                  </span>
                  <span className="font-medium text-ink">{formatINR(amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
