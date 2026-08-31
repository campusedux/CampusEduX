import Link from 'next/link';
import { HelpCircle, ClipboardList, Radio, GraduationCap, Activity } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getPlacementDashboard } from '@/lib/placement/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Placement Prep · CampusEduX Admin' };

const LINKS = [
  { href: '/placement/notes', label: 'Preparation Notes' },
  { href: '/placement/aptitude', label: 'Aptitude Questions' },
  { href: '/placement/dsa', label: 'DSA Problems' },
  { href: '/placement/hr', label: 'HR Questions' },
  { href: '/placement/company', label: 'Company Questions' },
  { href: '/placement/tests', label: 'Mock Tests' },
  { href: '/placement/live-tests', label: 'Live Tests' },
  { href: '/placement/results', label: 'Results' },
  { href: '/placement/student-analytics', label: 'Student Analytics' },
  { href: '/placement/difficulty', label: 'Difficulty Levels' },
  { href: '/placement/categories', label: 'Categories' },
  { href: '/placement/leaderboard', label: 'Leaderboard' },
  { href: '/placement/reports', label: 'Reports' },
];

export default async function PlacementDashboard() {
  await requireModule('placement');
  const d = await getPlacementDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Placement Prep" subtitle="Question banks, mock & live tests, results and leaderboards." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Questions" value={formatNumber(d.questionsTotal)} icon={HelpCircle} />
        <StatCard label="Mock tests" value={formatNumber(d.mockTests)} icon={ClipboardList} tone="brand" />
        <StatCard label="Live tests" value={formatNumber(d.liveTests)} icon={Radio} tone="info" />
        <StatCard label="Students" value={formatNumber(d.students)} icon={GraduationCap} />
        <StatCard label="Test attempts" value={formatNumber(d.attempts)} icon={Activity} tone="success" hint={`${d.uniqueTestTakers} unique`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Top categories" description="By test attempts" />
          <DonutChart data={d.topCategories} centerLabel="Attempts" />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Manage" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-light/40"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
