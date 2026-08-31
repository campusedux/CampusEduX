import Link from 'next/link';
import { Users, CheckCircle2, Clock, IndianRupee, Percent } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatINR, formatINRCompact, formatNumber } from '@/lib/utils';
import { getReferralDashboard } from '@/lib/referrals/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referral & Wallet · CampusEduX Admin' };

const NAV = [
  { href: '/referrals/users', label: 'Referral Users' },
  { href: '/referrals/earnings', label: 'Earnings' },
  { href: '/referrals/wallet', label: 'Wallet' },
  { href: '/referrals/wallet-requests', label: 'Wallet Requests' },
  { href: '/referrals/leaderboard', label: 'Leaderboard' },
  { href: '/referrals/reward-settings', label: 'Reward Settings' },
  { href: '/referrals/analytics', label: 'Analytics' },
];

export default async function ReferralDashboard() {
  await requireModule('referrals');
  const d = await getReferralDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral & Wallet"
        subtitle="Referral program, earnings and the platform wallet."
        action={
          <div className="flex flex-wrap gap-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-subtle">
                {n.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total referrals" value={formatNumber(d.total)} icon={Users} />
        <StatCard label="Successful" value={formatNumber(d.successful)} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value={formatNumber(d.pending)} icon={Clock} tone="warning" />
        <StatCard label="Paid out" value={formatINRCompact(d.totalPaid)} icon={IndianRupee} tone="brand" />
        <StatCard label="Conversion" value={`${d.conversion}%`} icon={Percent} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Referrals & earnings" description="Last 30 days" />
          <TrendChart
            data={d.trend}
            series={[
              { key: 'referrals', label: 'Referrals', color: '#4F39F6' },
              { key: 'earnings', label: 'Earnings (₹)', color: '#16A34A' },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Invite channels" />
          <DonutChart data={d.channels} centerLabel="Referrals" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Top earning referrers" />
        {d.topReferrers.length === 0 ? (
          <EmptyState title="No referral earnings yet" />
        ) : (
          <ul className="space-y-2">
            {d.topReferrers.map((r, i) => (
              <li key={r.email || i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                  {r.name}
                  <span className="text-xs text-ink-faint">{r.email}</span>
                </span>
                <span className="font-medium text-ink">
                  {formatINR(r.earned)} <span className="text-xs text-ink-faint">· {r.count} converted</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
