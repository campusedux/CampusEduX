import Link from 'next/link';
import { FileText, Download, Gauge, Users } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getResumeDashboard } from '@/lib/resume/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Builder · CampusEduX Admin' };

const LINKS = [
  { href: '/resume/templates', label: 'Templates' },
  { href: '/resume/templates/categories', label: 'Template Categories' },
  { href: '/resume/ats-rules', label: 'ATS Rules & Guidelines' },
  { href: '/resume/ai-config', label: 'AI Assist Config' },
  { href: '/resume/downloads', label: 'Resume Downloads' },
  { href: '/resume/analytics', label: 'Analytics' },
];

export default async function ResumeDashboard() {
  await requireModule('resume');
  const d = await getResumeDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Resume Builder" subtitle="Templates, ATS guidance and resume-builder usage." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Resumes built" value={formatNumber(d.resumes)} icon={FileText} />
        <StatCard label="Downloads" value={formatNumber(d.downloads)} icon={Download} tone="info" />
        <StatCard label="Avg ATS score" value={`${d.avgAts}`} icon={Gauge} tone="success" />
        <StatCard label="Active users" value={formatNumber(d.activeUsers)} icon={Users} tone="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top templates" description="By resumes created" />
          <DonutChart data={d.topTemplates} centerLabel="Resumes" />
        </Card>
        <Card>
          <CardHeader title="ATS score distribution" />
          <DonutChart data={d.scoreBands} centerLabel="Resumes" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Manage" />
        <div className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:bg-brand-light/40"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
