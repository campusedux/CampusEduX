import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime, formatINR } from '@/lib/utils';
import { RefundActions } from '@/app/orders/RefundActions';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
  cancelled: 'neutral',
  requested: 'warning',
  approved: 'success',
  processed: 'success',
  rejected: 'danger',
};

const TABS = [
  { key: 'all', label: 'All orders' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'refunds', label: 'Refund requests' },
] as const;

async function getOrders(status?: string) {
  const supabase = createClient();
  let query = supabase
    .from('orders')
    .select('id, total_amount, status, created_at, user_profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getPendingRefunds() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('refunds')
    .select('id, order_id, amount, reason, status, created_at, orders(user_profiles(full_name, email))')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function OrdersPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab ?? 'all';
  const isRefundsTab = tab === 'refunds';

  const [orders, refunds] = await Promise.all([
    isRefundsTab ? Promise.resolve([]) : getOrders(tab),
    isRefundsTab ? getPendingRefunds() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Orders</h1>
        <p className="text-sm text-ink-muted">Payments, fulfillment, and refunds</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/orders${t.key === 'all' ? '' : `?tab=${t.key}`}`}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.key ? 'border-b-2 border-brand text-brand' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card>
        {isRefundsTab ? (
          refunds.length === 0 ? (
            <EmptyState title="No refund requests" description="Approved and rejected requests show up here too." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Requested</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund: any) => (
                  <tr key={refund.id} className="border-t border-border">
                    <td className="py-2.5">
                      <Link href={`/orders/${refund.order_id}`} className="hover:text-brand hover:underline">
                        {refund.orders?.user_profiles?.full_name || refund.orders?.user_profiles?.email || 'Unknown'}
                      </Link>
                    </td>
                    <td className="py-2.5 font-mono">{formatINR(Number(refund.amount))}</td>
                    <td className="py-2.5 max-w-xs truncate text-ink-muted">{refund.reason || '—'}</td>
                    <td className="py-2.5">
                      <Badge label={refund.status} tone={STATUS_TONE[refund.status] ?? 'neutral'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(refund.created_at)}</td>
                    <td className="py-2.5">
                      {refund.status === 'requested' ? <RefundActions refundId={refund.id} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-2.5">
                    <Link href={`/orders/${order.id}`} className="hover:text-brand hover:underline">
                      {order.user_profiles?.full_name || order.user_profiles?.email || 'Unknown'}
                    </Link>
                  </td>
                  <td className="py-2.5 font-mono">{formatINR(Number(order.total_amount))}</td>
                  <td className="py-2.5">
                    <Badge label={order.status} tone={STATUS_TONE[order.status] ?? 'neutral'} />
                  </td>
                  <td className="py-2.5 text-ink-muted">{formatDateTime(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
