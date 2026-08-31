import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime, formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  captured: 'success',
  authorized: 'warning',
  created: 'neutral',
  failed: 'danger',
  refunded: 'neutral',
};

export default async function PaymentsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();
  let query = supabase
    .from('payments')
    .select('id, razorpay_payment_id, method, status, amount, created_at, order_id, orders(user_profiles(full_name, email))')
    .order('created_at', { ascending: false })
    .limit(100);
  if (searchParams.status) query = query.eq('status', searchParams.status);
  const { data: payments, error } = await query;
  if (error) throw new Error(error.message);

  const tabs = [
    { key: undefined, label: 'All' },
    { key: 'captured', label: 'Captured' },
    { key: 'failed', label: 'Failed' },
    { key: 'refunded', label: 'Refunded' },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Payments</h1>
        <p className="text-sm text-ink-muted">
          Razorpay transaction ledger, written automatically by the payment webhook. Refunds are approved from{' '}
          <Link href="/orders" className="text-brand hover:underline">
            Orders → Refund requests
          </Link>
          .
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.key ? `/payments?status=${tab.key}` : '/payments'}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              searchParams.status === tab.key ? 'bg-brand text-white' : 'bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card className="p-0">
        {!payments || payments.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No payments yet" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Razorpay Payment ID</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const customer = (p as unknown as { orders: { user_profiles: { full_name: string; email: string } } }).orders
                  ?.user_profiles;
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-muted">{p.razorpay_payment_id ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="text-ink">{customer?.full_name ?? '—'}</div>
                      <div className="text-xs text-ink-faint">{customer?.email ?? ''}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{p.method ?? '—'}</td>
                    <td className="px-5 py-3 text-ink">{formatINR(p.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge label={p.status} tone={STATUS_TONE[p.status] ?? 'neutral'} />
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{formatDateTime(p.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/orders/${p.order_id}`} className="text-brand hover:underline">
                        View order
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
