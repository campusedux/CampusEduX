import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getReferralAnalytics } from '@/lib/referrals/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referral Analytics · CampusEduX Admin' };

export default async function ReferralAnalyticsPage() {
  await requireModule('referrals');
  const a = await getReferralAnalytics();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/referrals" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Referral & Wallet
        </Link>
        <PageHeader title="Referral Analytics" subtitle="Referrals vs earnings, invite sources and top cities." />
      </div>

      <Card>
        <CardHeader title="Referrals vs earnings" description="Monthly" />
        {a.dual.length ? (
          <TrendChart
            data={a.dual}
            series={[
              { key: 'referrals', label: 'Referrals', color: '#4F39F6' },
              { key: 'earnings', label: 'Earnings (₹)', color: '#16A34A' },
            ]}
            area={false}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">Not enough data yet.</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Referrals by source" />
          <DonutChart data={a.bySource} centerLabel="Referrals" />
        </Card>
        <Card>
          <CardHeader title="Top-performing cities" />
          {a.topCities.length === 0 ? (
            <EmptyState title="No location data" />
          ) : (
            <ul className="space-y-2">
              {a.topCities.map((c, i) => (
                <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                    {c.label}
                  </span>
                  <span className="font-medium text-ink">{formatNumber(c.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
