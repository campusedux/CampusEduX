import Link from 'next/link';
import { ArrowLeft, Users, Trophy, Activity } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { getTestResults } from '@/lib/placement/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Test Results · CampusEduX Admin' };

export default async function TestResultsPage({ params }: { params: { testId: string } }) {
  await requireModule('placement');
  const r = await getTestResults(params.testId);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/placement/results" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Results
        </Link>
        <PageHeader title={r.test?.title ?? 'Test results'} subtitle="Scores as a % of total marks." />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Students" value={formatNumber(r.totalStudents)} icon={Users} />
        <StatCard label="Attempts" value={formatNumber(r.attempts)} icon={Activity} tone="brand" />
        <StatCard label="Highest" value={`${Math.round(r.highest)}%`} icon={Trophy} tone="success" />
        <StatCard label="Average" value={`${Math.round(r.avg)}%`} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Score distribution" />
          <DonutChart data={r.bands} centerLabel="Attempts" />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Top performers" />
          {r.top.length === 0 ? (
            <EmptyState title="No attempts yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2 font-medium">Correct</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {r.top.map((a: any, i: number) => (
                    <tr key={i} className="border-t border-border odd:bg-surface-subtle/40">
                      <td className="py-2 text-ink-faint">{i + 1}</td>
                      <td className="py-2">
                        <p className="font-medium text-ink">{a.user?.full_name || 'CampusEduX user'}</p>
                        <p className="text-xs text-ink-faint">{a.user?.email}</p>
                      </td>
                      <td className="py-2 font-mono">
                        {a.score}/{a.total_marks}
                        <span className="ml-1 text-xs text-ink-faint">
                          ({a.total_marks ? Math.round((a.score / a.total_marks) * 100) : 0}%)
                        </span>
                      </td>
                      <td className="py-2 text-ink-muted">
                        {a.correct_count}/{a.correct_count + a.incorrect_count}
                      </td>
                      <td className="py-2 text-ink-muted">{Math.round((a.time_taken_seconds || 0) / 60)} min</td>
                      <td className="py-2 text-ink-muted">{formatDateTime(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
