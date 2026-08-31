import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/primitives';
import { ExportButton } from '@/components/ui/ExportButton';
import { TrendChart } from '@/components/charts/TrendChart';
import { formatINR, formatNumber } from '@/lib/utils';
import { getMonthlyReport } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Monthly Reports · CampusEduX Admin' };

export default async function MonthlyReportsPage() {
  await requireModule('orders');
  const rows = await getMonthlyReport();
  const exportRows = rows.map((m) => ({ month: m.key, revenue: m.revenue, orders: m.orders, users: m.users, growth_pct: m.growth ?? '' }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader
          title="Monthly Reports"
          subtitle="Revenue, orders and new users by month (last 12)."
          action={<ExportButton rows={exportRows} filename="monthly-report" label="Export Report" />}
        />
      </div>

      <Card>
        <TrendChart
          data={rows.map((m) => ({ label: m.label, revenue: m.revenue, orders: m.orders }))}
          series={[
            { key: 'revenue', label: 'Revenue (₹)', color: '#16A34A' },
            { key: 'orders', label: 'Orders', color: '#4F39F6' },
          ]}
        />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 font-medium">Revenue</th>
                <th className="pb-2 font-medium">Orders</th>
                <th className="pb-2 font-medium">New users</th>
                <th className="pb-2 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.key} className="border-t border-border odd:bg-surface-subtle/40">
                  <td className="py-2.5 font-medium text-ink">{m.label}</td>
                  <td className="py-2.5 font-mono">{formatINR(m.revenue)}</td>
                  <td className="py-2.5 text-ink-muted">{formatNumber(m.orders)}</td>
                  <td className="py-2.5 text-ink-muted">{formatNumber(m.users)}</td>
                  <td className="py-2.5">
                    {m.growth == null ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <span className={m.growth >= 0 ? 'text-success' : 'text-danger'}>
                        {m.growth >= 0 ? '▲' : '▼'} {Math.abs(m.growth)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
