import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getRatingAnalytics } from '@/lib/reviews/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rating Analytics · CampusEduX Admin' };

export default async function RatingAnalyticsPage() {
  await requireModule('reviews');
  const a = await getRatingAnalytics();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/reviews" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Reviews & Ratings
        </Link>
        <PageHeader title="Rating Analytics" subtitle="Distribution, trend and top-rated entities." />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Average rating" value={a.avg.toFixed(2)} icon={Star} tone="warning" />
        <StatCard label="Total reviews" value={formatNumber(a.count)} />
        <StatCard label="5★ share" value={`${a.count ? Math.round((a.dist[0].n / a.count) * 100) : 0}%`} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rating distribution" />
          <div className="space-y-1.5">
            {a.dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-ink-muted">{d.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle">
                  <div className="h-full rounded-full bg-warning" style={{ width: `${a.count ? (d.n / a.count) * 100 : 0}%` }} />
                </div>
                <span className="w-10 text-right text-ink-faint">{d.n}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Reviews by entity type" />
          <DonutChart data={a.byType} centerLabel="Reviews" />
        </Card>
      </div>

      <Card>
        <CardHeader title="Average rating over time" description="Monthly" />
        {a.trend.length ? (
          <TrendChart data={a.trend} series={[{ key: 'rating', label: 'Avg rating', color: '#E8A93A' }]} area={false} />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">Not enough data yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Top-rated projects" />
        {a.topRated.length === 0 ? (
          <EmptyState title="No rated projects yet" />
        ) : (
          <ul className="space-y-2">
            {a.topRated.map((p: any, i: number) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                  {p.title}
                </span>
                <span className="font-medium text-ink">
                  {Number(p.rating).toFixed(1)}★ <span className="text-xs text-ink-faint">({p.review_count})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
