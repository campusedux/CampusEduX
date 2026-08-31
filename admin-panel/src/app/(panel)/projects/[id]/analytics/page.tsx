import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getProject } from '@/lib/projects/queries';
import { safe } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Eye, Download, ShoppingCart, Star } from 'lucide-react';
import { formatNumber, formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Analytics · CampusEduX Admin' };

const DAY = 86_400_000;

export default async function ProjectAnalyticsPage({ params }: { params: { id: string } }) {
  await requireModule('projects');
  const supabase = createClient();
  const project = await getProject(params.id);
  if (!project) return null;

  const since = new Date(Date.now() - 29 * DAY);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [dls, sales, buyerLocs] = await Promise.all([
    safe(
      supabase.from('downloads').select('downloaded_at').eq('project_id', params.id).gte('downloaded_at', sinceIso),
      [] as { downloaded_at: string }[],
    ),
    safe(
      supabase
        .from('purchases')
        .select('created_at, total_amount, status')
        .eq('project_id', params.id)
        .gte('created_at', sinceIso),
      [] as { created_at: string; total_amount: number; status: string }[],
    ),
    safe(
      supabase
        .from('purchases')
        .select('status, profile:profiles(location)')
        .eq('project_id', params.id)
        .eq('status', 'success')
        .limit(1000),
      [] as any[],
    ),
  ]);

  const okSales = sales.filter((s) => s.status === 'success');
  const revenue = okSales.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  const buckets = new Map<string, { label: string; downloads: number; sales: number }>();
  for (let i = 0; i < 30; i += 1) {
    const k = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    buckets.set(k, { label: new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), downloads: 0, sales: 0 });
  }
  for (const d of dls) {
    const b = buckets.get(String(d.downloaded_at).slice(0, 10));
    if (b) b.downloads += 1;
  }
  for (const s of okSales) {
    const b = buckets.get(String(s.created_at).slice(0, 10));
    if (b) b.sales += 1;
  }

  const locCounts = new Map<string, number>();
  for (const r of buyerLocs) {
    const loc = r.profile?.location || 'Unknown';
    locCounts.set(loc, (locCounts.get(loc) ?? 0) + 1);
  }
  const topLocs = [...locCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Views" value={formatNumber(project.view_count)} icon={Eye} />
        <StatCard label="Downloads (all time)" value={formatNumber(project.sales_count)} icon={Download} tone="info" hint="approx" />
        <StatCard label="Sales (all time)" value={formatNumber(project.sales_count)} icon={ShoppingCart} tone="success" />
        <StatCard label="Rating" value={`${Number(project.rating).toFixed(1)} (${project.review_count})`} icon={Star} tone="warning" />
      </div>

      <Card>
        <CardHeader title="Downloads & sales" description={`Last 30 days · ${formatINR(revenue)} revenue in period`} />
        <TrendChart
          data={[...buckets.values()]}
          series={[
            { key: 'downloads', label: 'Downloads', color: '#2563EB' },
            { key: 'sales', label: 'Sales', color: '#16A34A' },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Top buyer locations" description="From buyer profiles" />
        <DonutChart data={topLocs} centerLabel="Buyers" />
      </Card>
    </div>
  );
}
