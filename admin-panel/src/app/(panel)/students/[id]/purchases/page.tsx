import { createClient } from '@/lib/supabase/server';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { Pagination } from '@/components/ui/Pagination';
import { formatINR, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Purchases · CampusEduX Admin' };

const SIZE = 15;

export default async function StudentPurchasesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * SIZE;

  const { data, count, error } = await supabase
    .from('purchases')
    .select('id, total_amount, price, discount, status, coupon_code, created_at, project:projects(title)', {
      count: 'estimated',
    })
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    .range(from, from + SIZE - 1);

  const rows = error ? [] : (data ?? []);
  const total = error ? 0 : count ?? 0;

  return (
    <Card>
      {rows.length === 0 ? (
        <EmptyState title="No purchases" description="This student hasn’t bought anything yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Project</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Discount</th>
                <th className="pb-2 font-medium">Coupon</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o: any) => (
                <tr key={o.id} className="border-t border-border odd:bg-surface-subtle/40">
                  <td className="py-2.5 text-ink">{o.project?.title || '—'}</td>
                  <td className="py-2.5 font-mono">{formatINR(Number(o.total_amount))}</td>
                  <td className="py-2.5 text-ink-muted">{o.discount ? formatINR(Number(o.discount)) : '—'}</td>
                  <td className="py-2.5 text-ink-muted">{o.coupon_code || '—'}</td>
                  <td className="py-2.5">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="py-2.5 text-ink-muted">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <Pagination page={page} pageSize={SIZE} total={total} basePath={`/students/${params.id}/purchases`} />
      </div>
    </Card>
  );
}
