import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Percent } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getPaymentAnalytics } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment Analytics · CampusEduX Admin' };

export default async function PaymentAnalyticsPage() {
  await requireModule('orders');
  const a = await getPaymentAnalytics();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Payment Analytics" subtitle="Success vs failure, and success rate per payment method." />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Success rate" value={`${a.successRate}%`} icon={CheckCircle2} tone="success" />
        <StatCard label="Failure rate" value={`${a.failureRate}%`} icon={XCircle} tone="danger" />
        <StatCard label="Total payments" value={formatNumber(a.counts.total)} icon={Percent} />
        <StatCard label="Pending" value={formatNumber(a.counts.pend)} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Outcome split" />
          <DonutChart
            data={[
              { label: 'Success', value: a.counts.succ, color: '#16A34A' },
              { label: 'Failed', value: a.counts.fail, color: '#DC2626' },
              { label: 'Pending', value: a.counts.pend, color: '#E8A93A' },
            ]}
            centerLabel="Payments"
          />
        </Card>
        <Card>
          <CardHeader title="Success rate by method" />
          {a.methodBars.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">No payment data yet.</p>
          ) : (
            <div className="space-y-3">
              {a.methodBars.map((m) => (
                <div key={m.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{m.label}</span>
                    <span className="text-ink-muted">
                      {m.value}% <span className="text-xs text-ink-faint">({m.total})</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
