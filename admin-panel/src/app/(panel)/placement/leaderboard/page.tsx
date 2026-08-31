import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, EmptyState } from '@/components/ui/primitives';
import { initials } from '@/lib/utils';
import { getLeaderboard, getDsaLeaderboard } from '@/lib/placement/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leaderboard · CampusEduX Admin' };

const TABS = [
  { value: 'overall', label: 'Overall' },
  { value: 'aptitude', label: 'Aptitude' },
  { value: 'dsa', label: 'DSA' },
  { value: 'hr', label: 'HR' },
  { value: 'company', label: 'Company' },
];

export default async function LeaderboardPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireModule('placement');
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : 'overall';
  const rows = tab === 'dsa' ? await getDsaLeaderboard() : await getLeaderboard(tab);

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" subtitle="Ranked by total score; accuracy from correct vs answered." />
      <Tabs basePath="/placement/leaderboard" current={tab} tabs={TABS} />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No ranked students yet" description="Rankings appear once students attempt tests." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Rank</th>
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">{tab === 'dsa' ? 'Solved' : 'Tests'}</th>
                  <th className="pb-2 font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, i: number) => (
                  <tr key={r.user_id} className="border-t border-border odd:bg-surface-subtle/40">
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
                    <td className="py-2.5 font-mono">{r.score}</td>
                    <td className="py-2.5 text-ink-muted">{r.tests}</td>
                    <td className="py-2.5 text-ink-muted">{r.accuracy}%</td>
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
