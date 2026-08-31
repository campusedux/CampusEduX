import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, Badge } from '@/components/ui/primitives';
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
  processed: 'success',
  rejected: 'danger',
  captured: 'success',
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: order }, { data: items }, { data: payments }, { data: refunds }] = await Promise.all([
    supabase.from('orders').select('*, user_profiles(full_name, email, mobile)').eq('id', params.id).single(),
    supabase.from('order_items').select('id, unit_price, projects(title, slug)').eq('order_id', params.id),
    supabase.from('payments').select('*').eq('order_id', params.id).order('created_at', { ascending: false }),
    supabase.from('refunds').select('*').eq('order_id', params.id).order('created_at', { ascending: false }),
  ]);

  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-lg font-bold text-ink">#{order.id.slice(0, 8)}</h1>
            <Badge label={order.status} tone={STATUS_TONE[order.status] ?? 'neutral'} />
          </div>
          <p className="text-sm text-ink-muted">
            {order.user_profiles?.full_name || order.user_profiles?.email} · {formatDateTime(order.created_at)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Items" />
        <ul className="divide-y divide-border">
          {(items ?? []).map((item: any) => (
            <li key={item.id} className="flex justify-between py-2 text-sm">
              <span>{item.projects?.title}</span>
              <span className="font-mono">{formatINR(Number(item.unit_price))}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span>
            <span className="font-mono">{formatINR(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount_amount) > 0 ? (
            <div className="flex justify-between text-ink-muted">
              <span>Discount</span>
              <span className="font-mono">−{formatINR(Number(order.discount_amount))}</span>
            </div>
          ) : null}
          {Number(order.wallet_amount_used) > 0 ? (
            <div className="flex justify-between text-ink-muted">
              <span>Wallet applied</span>
              <span className="font-mono">−{formatINR(Number(order.wallet_amount_used))}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-muted">
            <span>Tax (GST)</span>
            <span className="font-mono">{formatINR(Number(order.tax_amount))}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Total</span>
            <span className="font-mono">{formatINR(Number(order.total_amount))}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Payments" />
        {(payments ?? []).length === 0 ? (
          <p className="text-sm text-ink-faint">No payment recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(payments ?? []).map((payment: any) => (
              <li key={payment.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-ink-muted">{payment.razorpay_payment_id}</span>
                <span className="font-mono">{formatINR(Number(payment.amount))}</span>
                <Badge label={payment.status} tone={STATUS_TONE[payment.status] ?? 'neutral'} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Refunds" />
        {(refunds ?? []).length === 0 ? (
          <p className="text-sm text-ink-faint">No refunds requested.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(refunds ?? []).map((refund: any) => (
              <li key={refund.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-mono">{formatINR(Number(refund.amount))}</p>
                  <p className="text-xs text-ink-faint">{refund.reason || 'No reason given'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={refund.status} tone={STATUS_TONE[refund.status] ?? 'neutral'} />
                  {refund.status === 'requested' ? <RefundActions refundId={refund.id} /> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Link href="/orders" className="inline-block text-sm font-medium text-brand hover:underline">
        ← Back to orders
      </Link>
    </div>
  );
}
