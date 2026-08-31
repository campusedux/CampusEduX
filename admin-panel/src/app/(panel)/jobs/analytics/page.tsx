import Link from 'next/link';
import { ArrowLeft, Briefcase, Users, Trophy, Percent } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { JOB_TYPES } from '@/lib/jobs/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Job Analytics · CampusEduX Admin' };

const DAY = 86_400_000;

export default async function JobAnalyticsPage() {
  await requireModule('jobs');
  const supabase = createClient();
  const since = new Date(Date.now() - 29 * DAY);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [jobs, apps, jobTypes, appsByCompany] = await Promise.all([
    safe(supabase.from('jobs').select('created_at').gte('created_at', sinceIso), [] as { created_at: string }[]),
    safe(
      supabase.from('applications').select('created_at, status, updated_at').gte('created_at', sinceIso),
      [] as { created_at: string; status: string; updated_at: string }[],
    ),
    safe(supabase.from('jobs').select('job_type').limit(5000), [] as { job_type: string }[]),
    safe(
      supabase.from('applications').select('job:jobs(company_name)').limit(3000),
      [] as any[],
    ),
  ]);

  const buckets = new Map<string, { label: string; postings: number; applications: number; hires: number }>();
  for (let i = 0; i < 30; i += 1) {
    const k = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    buckets.set(k, { label: new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), postings: 0, applications: 0, hires: 0 });
  }
  for (const j of jobs) {
    const b = buckets.get(String(j.created_at).slice(0, 10));
    if (b) b.postings += 1;
  }
  for (const a of apps) {
    const b = buckets.get(String(a.created_at).slice(0, 10));
    if (b) b.applications += 1;
    if (a.status === 'hired') {
      const hb = buckets.get(String(a.updated_at ?? a.created_at).slice(0, 10));
      if (hb) hb.hires += 1;
    }
  }

  const typeCounts = JOB_TYPES.map((t) => ({ label: t, value: jobTypes.filter((j) => j.job_type === t).length }));

  const companyCounts = new Map<string, number>();
  for (const a of appsByCompany) {
    const c = a.job?.company_name || 'Unknown';
    companyCounts.set(c, (companyCounts.get(c) ?? 0) + 1);
  }
  const topCompanies = [...companyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const totalApps = apps.length;
  const hires = apps.filter((a) => a.status === 'hired').length;
  const hireRate = totalApps ? Math.round((hires / totalApps) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/jobs" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Jobs
        </Link>
        <PageHeader title="Job Analytics" subtitle="Postings, applications and hiring — last 30 days." />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Postings (30d)" value={formatNumber(jobs.length)} icon={Briefcase} />
        <StatCard label="Applications (30d)" value={formatNumber(totalApps)} icon={Users} tone="brand" />
        <StatCard label="Hires (30d)" value={formatNumber(hires)} icon={Trophy} tone="success" />
        <StatCard label="Hire rate" value={`${hireRate}%`} icon={Percent} tone="info" />
      </div>

      <Card>
        <CardHeader title="Activity over time" />
        <TrendChart
          data={[...buckets.values()]}
          series={[
            { key: 'postings', label: 'Postings', color: '#4F39F6' },
            { key: 'applications', label: 'Applications', color: '#2563EB' },
            { key: 'hires', label: 'Hires', color: '#16A34A' },
          ]}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Jobs by type" />
          <DonutChart data={typeCounts} centerLabel="Jobs" />
        </Card>
        <Card>
          <CardHeader title="Top companies by applications" />
          {topCompanies.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">No applications yet.</p>
          ) : (
            <ul className="space-y-2">
              {topCompanies.map(([name, n], i) => (
                <li key={name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                    {name}
                  </span>
                  <span className="font-medium text-ink">{formatNumber(n)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
