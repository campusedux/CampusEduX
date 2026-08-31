import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { ReportGenerator } from './ReportGenerator';
import { deleteReport } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Placement Reports · CampusEduX Admin' };

export default async function PlacementReportsPage() {
  const admin = await requireModule('placement');
  const supabase = createClient();
  const history = await safe(
    supabase
      .from('generated_reports')
      .select('id, kind, params, row_count, created_by_email, created_at')
      .eq('module', 'placement')
      .order('created_at', { ascending: false })
      .limit(50),
    [] as any[],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Placement Reports" subtitle="Export attempts, leaderboards and the question bank." />

      <ReportGenerator canGenerate={admin.perms.placement.view} />

      <Card>
        <CardHeader title="Recent reports" />
        {history.length === 0 ? (
          <EmptyState title="No reports generated yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Range</th>
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
                    <td className="py-2.5 text-ink-muted">
                      {h.params?.from || '…'} → {h.params?.to || '…'}
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatNumber(h.row_count)}</td>
                    <td className="py-2.5 text-ink-muted">{h.created_by_email || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(h.created_at)}</td>
                    <td className="py-2.5 text-right">
                      <DeleteButton action={deleteReport.bind(null, h.id)} confirmMessage="Remove this history entry?" />
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
