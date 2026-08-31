import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { getResumeAnalytics } from '@/lib/resume/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Analytics · CampusEduX Admin' };

export default async function ResumeAnalyticsPage() {
  await requireModule('resume');
  const a = await getResumeAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader title="Resume Analytics" subtitle="ATS scores, resumes over time and template mix." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="ATS score distribution" />
          <DonutChart data={a.bands} centerLabel="Resumes" />
        </Card>
        <Card>
          <CardHeader title="Resumes created over time" description="Monthly" />
          {a.trend.length ? (
            <TrendChart data={a.trend} series={[{ key: 'resumes', label: 'Resumes', color: '#4F39F6' }]} />
          ) : (
            <p className="py-6 text-center text-sm text-ink-faint">Not enough data yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top templates" />
          <DonutChart data={a.topTemplates} centerLabel="Resumes" />
        </Card>
        <Card>
          <CardHeader title="Top categories" />
          <DonutChart data={a.topCategories} centerLabel="Resumes" />
        </Card>
      </div>
    </div>
  );
}
