import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getStudentPlacementAnalytics, getStudentOptions } from '@/lib/placement/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Analytics · CampusEduX Admin' };

export default async function StudentAnalyticsPage({ searchParams }: { searchParams: { student?: string } }) {
  await requireModule('placement');
  const student = searchParams.student ?? '';
  const [a, students] = await Promise.all([
    getStudentPlacementAnalytics(student || undefined),
    getStudentOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Analytics"
        subtitle={student ? 'Performance for one student.' : 'Placement performance across all students.'}
      />

      <SearchFilterBar
        placeholder="(use the student filter)"
        filters={
          <FilterSelect
            name="student"
            label="Student"
            options={students.map((s) => ({ value: s.id, label: `${s.full_name || s.email}` }))}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Tests attempted" value={formatNumber(a.attempts)} />
        {!student ? <StatCard label="Students" value={formatNumber(a.students)} tone="brand" /> : null}
        <StatCard label="Average score" value={`${a.avg}%`} tone="info" />
      </div>

      <Card>
        <CardHeader title="Improvement trend" description="Average score per month" />
        {a.trend.length ? (
          <TrendChart data={a.trend} series={[{ key: 'score', label: 'Avg %', color: '#4F39F6' }]} area={false} />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">Not enough data yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Performance by category" />
        <DonutChart data={a.byCategory.map((c) => ({ label: c.label, value: c.value }))} centerLabel="Avg %" valueFormatter={(n) => `${n}%`} />
      </Card>
    </div>
  );
}
