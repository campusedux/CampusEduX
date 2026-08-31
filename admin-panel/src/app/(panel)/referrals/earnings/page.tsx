import Link from 'next/link';
import { ArrowLeft, IndianRupee, Clock } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { formatINR, formatINRCompact } from '@/lib/utils';
import { getReferralEarnings } from '@/lib/referrals/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referral Earnings · CampusEduX Admin' };

export default async function ReferralEarningsPage() {
  await requireModule('referrals');
  const e = await getReferralEarnings();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/referrals" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Referral & Wallet
        </Link>
        <PageHeader title="Referral Earnings" subtitle="Paid vs pending referral rewards." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Paid out" value={formatINRCompact(e.paid)} icon={IndianRupee} tone="success" />
        <StatCard label="Pending" value={formatINRCompact(e.pendingAmt)} icon={Clock} tone="warning" />
      </div>

      <Card>
        <CardHeader title="Earnings over time" description="Monthly" />
        {e.trend.length ? (
          <TrendChart data={e.trend} series={[{ key: 'earnings', label: 'Earnings (₹)', color: '#16A34A' }]} currency />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">No earnings yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Top earners" />
        {e.topEarners.length === 0 ? (
          <EmptyState title="No earners yet" />
        ) : (
          <ul className="space-y-2">
            {e.topEarners.map((t, i) => (
              <li key={t.email || i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                  {t.name}
                  <span className="text-xs text-ink-faint">{t.email}</span>
                </span>
                <span className="font-medium text-ink">{formatINR(t.earned)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
