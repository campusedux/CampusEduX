import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatDate } from '@/lib/utils';
import { buildReport, REPORT_TYPES, type ReportType } from '@/lib/reports/builders';
import { ReportExport } from '../ReportExport';

export const dynamic = 'force-dynamic';

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams: { from?: string; to?: string };
}) {
  await requireModule('reports');
  if (!REPORT_TYPES.some((t) => t.value === params.type)) notFound();
  const r = await buildReport(params.type as ReportType, searchParams.from, searchParams.to);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/reports" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Reports
        </Link>
        <PageHeader
          title={r.label}
          subtitle={`${formatDate(r.range.from)} – ${formatDate(r.range.to)}`}
          action={<ReportExport kind={params.type} rows={r.rows} params={{ from: r.range.from, to: r.range.to }} />}
        />
      </div>

      <Card>
        <CardHeader title="Date range" />
        <DateRangePicker />
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {r.stats.map((st) => (
          <StatCard key={st.label} label={st.label} value={st.value} />
        ))}
      </div>

      <Card>
        <CardHeader title="Trend" description="Daily (last 90 days max)" />
        <TrendChart data={r.trend} series={r.trendKeys} currency={r.currency} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={r.donut.title} />
          <DonutChart data={r.donut.data} />
        </Card>
        <Card>
          <CardHeader title={r.topList.title} />
          {r.topList.items.length === 0 ? (
            <EmptyState title="No data" />
          ) : (
            <ul className="space-y-2">
              {r.topList.items.map((it, i) => (
                <li key={it.label + i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span className="w-5 text-right text-xs text-ink-faint">{i + 1}</span>
                    {it.label}
                  </span>
                  <span className="font-medium text-ink">{it.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
