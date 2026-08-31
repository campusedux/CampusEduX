import Link from 'next/link';
import { ArrowLeft, IndianRupee, Crown, Wallet } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatINR, formatINRCompact } from '@/lib/utils';
import { getRevenueBreakdown } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Revenue · CampusEduX Admin' };

export default async function OrdersRevenuePage() {
  await requireModule('orders');
  const r = await getRevenueBreakdown();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Revenue" subtitle="Where the money comes from." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Project sales" value={formatINRCompact(r.projectRevenue)} icon={IndianRupee} tone="success" />
        <StatCard label="Premium subscriptions" value={formatINRCompact(r.premiumRevenue)} icon={Crown} tone="brand" />
        <StatCard label="Wallet top-ups" value={formatINRCompact(r.topupVolume)} icon={Wallet} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Payment Method Distribution" />
          <DonutChart data={r.byMethod} centerLabel="Revenue" valueFormatter={(n) => formatINRCompact(n)} />
        </Card>
        <Card>
          <CardHeader title="Top selling products" description="By revenue" />
          {r.topProducts.length === 0 ? (
            <EmptyState title="No sales yet" />
          ) : (
            <ul className="space-y-2">
              {r.topProducts.map(([title, amount], i) => (
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
