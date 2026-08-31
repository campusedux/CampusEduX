import Link from 'next/link';
import { BarChart3, IndianRupee, ShoppingCart, GraduationCap, FolderKanban, Briefcase, Target, Gift, Sparkles } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { PresetBar } from './PresetBar';
import { deleteGeneratedReport } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reports · CampusEduX Admin' };

const TYPES = [
  { value: 'revenue', label: 'Revenue', icon: IndianRupee },
  { value: 'sales', label: 'Sales', icon: ShoppingCart },
  { value: 'students', label: 'Students', icon: GraduationCap },
  { value: 'projects', label: 'Projects', icon: FolderKanban },
  { value: 'jobs', label: 'Jobs', icon: Briefcase },
  { value: 'placement', label: 'Placement', icon: Target },
  { value: 'referral', label: 'Referral', icon: Gift },
  { value: 'revenue', label: 'Custom Report', icon: Sparkles },
];

export default async function ReportsHub({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  await requireModule('reports');
  const qs = new URLSearchParams();
  if (searchParams.from) qs.set('from', searchParams.from);
  if (searchParams.to) qs.set('to', searchParams.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const supabase = createClient();
  const history = await safe(
    supabase
      .from('generated_reports')
      .select('id, kind, module, params, format, row_count, created_by_email, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    [] as any[],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export reports across the platform." />

      <Card>
        <CardHeader title="Date range preset" description="Applied to whichever report you open next." />
        <PresetBar />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TYPES.map(({ value, label, icon: Icon }) => (
          <Link
            key={label}
            href={`/reports/${value}${suffix}`}
            className="group flex flex-col items-start gap-3 rounded-card border border-border bg-white p-4 shadow-sm transition-colors hover:border-brand hover:bg-brand-light/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand-dark group-hover:bg-brand group-hover:text-white">
              <Icon size={16} />
            </span>
            <span className="text-sm font-semibold text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Recent reports"
          action={<span className="inline-flex items-center gap-1 text-xs text-ink-faint"><BarChart3 size={13} /> Excel · PDF · CSV on each report</span>}
        />
        {history.length === 0 ? (
          <EmptyState title="No reports generated yet" description="Open a report above and hit Export." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Module</th>
                  <th className="pb-2 font-medium">Range</th>
                  <th className="pb-2 font-medium">Format</th>
                  <th className="pb-2 font-medium">Rows</th>
                  <th className="pb-2 font-medium">By</th>
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((h: any) => (
                  <tr key={h.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <Badge label={h.kind} tone="neutral" />
                    </td>
                    <td className="py-2.5 text-ink-muted">{h.module}</td>
                    <td className="py-2.5 text-ink-muted">
                      {h.params?.from || '…'} → {h.params?.to || '…'}
                    </td>
                    <td className="py-2.5 uppercase text-ink-muted">{h.format}</td>
                    <td className="py-2.5 text-ink-muted">{formatNumber(h.row_count)}</td>
                    <td className="py-2.5 text-ink-muted">{h.created_by_email || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(h.created_at)}</td>
                    <td className="py-2.5 text-right">
                      <DeleteButton action={deleteGeneratedReport.bind(null, h.id)} confirmMessage="Remove this history entry?" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
