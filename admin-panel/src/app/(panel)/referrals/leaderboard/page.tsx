import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, EmptyState } from '@/components/ui/primitives';
import { formatINR, formatDate, initials } from '@/lib/utils';
import { getReferralLeaderboard } from '@/lib/referrals/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referral Leaderboard · CampusEduX Admin' };

const TABS = [
  { value: 'earners', label: 'Top Earners' },
  { value: 'referrals', label: 'Top Referrals' },
  { value: 'active', label: 'Most Active' },
];

export default async function ReferralLeaderboardPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireModule('referrals');
  const tab = (TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab : 'earners') as
    | 'earners'
    | 'referrals'
    | 'active';
  const rows = await getReferralLeaderboard(tab);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/referrals" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Referral & Wallet
        </Link>
        <PageHeader title="Referral Leaderboard" subtitle="Ranked referrers." />
      </div>

      <Tabs basePath="/referrals/leaderboard" current={tab} tabs={TABS} />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No referrers yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Rank</th>
                  <th className="pb-2 font-medium">Referrer</th>
                  <th className="pb-2 font-medium">Referrals</th>
                  <th className="pb-2 font-medium">Successful</th>
                  <th className="pb-2 font-medium">Earned</th>
                  <th className="pb-2 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5 font-semibold text-ink">#{i + 1}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                          {initials(r.name)}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{r.name}</p>
                          <p className="text-xs text-ink-faint">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink-muted">{r.total}</td>
                    <td className="py-2.5 text-ink-muted">{r.successful}</td>
                    <td className="py-2.5 font-mono">{formatINR(r.earned)}</td>
                    <td className="py-2.5 text-ink-muted">{formatDate(r.last)}</td>
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
