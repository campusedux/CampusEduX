import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { formatINR, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recent Orders · CampusEduX Admin' };

const PAGE_SIZE = 20;

export default async function RecentOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string };
}) {
  await requireModule('dashboard');
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('purchases')
    .select('id, total_amount, status, created_at, coupon_code, profile:profiles(full_name, email), project:projects(title)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status) query = query.eq('status', status);
  if (q) query = query.or(`coupon_code.ilike.%${q}%,razorpay_order_id.ilike.%${q}%,razorpay_payment_id.ilike.%${q}%`);

  const { data, count, error } = await query;
  const rows = error ? [] : (data ?? []);
  const total = error ? 0 : count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Recent Orders" subtitle="Every purchase across the platform, newest first." />

      <SearchFilterBar
        placeholder="Search by coupon or Razorpay id…"
        filters={
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: 'success', label: 'Success' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={error ? 'The purchases table isn’t available yet — apply the mobile app migrations.' : 'Try a different search or filter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o: any) => (
                  <tr key={o.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{o.profile?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{o.profile?.email}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{o.project?.title || '—'}</td>
                    <td className="py-2.5 font-mono">{formatINR(Number(o.total_amount))}</td>
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
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/recent-orders"
            searchParams={{ q, status }}
          />
        </div>
      </Card>
    </div>
  );
}
