import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { getAnalytics, type AnalyticsTab } from '@/lib/dashboard/analytics';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics · CampusEduX Admin' };

const TABS = [
  { value: 'users', label: 'Users' },
  { value: 'projects', label: 'Projects' },
  { value: 'orders', label: 'Orders' },
  { value: 'revenue', label: 'Revenue' },
];

export default async function AnalyticsPage({ searchParams }: { searchParams: { tab?: string } }) {
  await requireModule('dashboard');
  const tab = (TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab : 'users') as AnalyticsTab;
  const a = await getAnalytics(tab);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Growth and breakdowns across users, projects, orders and revenue." />
      <Tabs basePath="/analytics" current={tab} tabs={TABS} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {a.stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            current={s.current}
            previous={s.previous}
            hint={s.hint}
          />
        ))}
      </div>

      <Card>
        <CardHeader title={`${TABS.find((t) => t.value === tab)?.label} trend`} description="Last 30 days" />
        <TrendChart data={a.series} series={a.seriesKeys} currency={a.currency} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {a.donuts.map((d) => (
          <Card key={d.title}>
            <CardHeader title={d.title} />
            <DonutChart data={d.data} />
          </Card>
        ))}
      </div>
    </div>
  );
}
