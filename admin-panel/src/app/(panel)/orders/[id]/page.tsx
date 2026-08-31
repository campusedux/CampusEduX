import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { getOrder } from '@/lib/orders/queries';
import { Card, CardHeader, StatusPill } from '@/components/ui/primitives';
import { formatINR, formatDateTime } from '@/lib/utils';
import { OrderNotesForm } from './OrderNotesForm';
import { saveOrderNotes } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order Details · CampusEduX Admin' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[62%] break-words text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('orders');
  const o = await getOrder(params.id);
  if (!o) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">Order {o.id.slice(0, 8)}</h1>
          <StatusPill status={o.status} />
        </div>
        <p className="mt-1 text-sm text-ink-muted">{formatDateTime(o.created_at)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Summary" />
          <Row label="Product" value={o.project?.title} />
          <Row label="Price" value={formatINR(Number(o.price))} />
          <Row label="Discount" value={o.discount ? `− ${formatINR(Number(o.discount))}` : '—'} />
          <Row label="Coupon" value={o.coupon_code} />
          <Row label="Platform fee" value={formatINR(Number(o.platform_fee))} />
          <Row label="Total paid" value={<span className="text-base">{formatINR(Number(o.total_amount))}</span>} />
          <Row label="Version" value={o.purchased_version} />
        </Card>

        <Card>
          <CardHeader title="Customer" />
          <Row
            label="Name"
            value={
              o.profile ? (
                <Link href={`/students/${o.profile.id}`} className="text-brand hover:underline">
                  {o.profile.full_name}
                </Link>
              ) : (
                'Unknown'
              )
            }
          />
          <Row label="Email" value={o.profile?.email} />
          <Row label="Phone" value={o.profile?.mobile_number} />
        </Card>

        <Card>
          <CardHeader title="Payment details" />
          <Row label="Method" value={o.payment_method || (o.razorpay_payment_id ? 'Razorpay' : '—')} />
          <Row label="Razorpay order id" value={o.razorpay_order_id} />
          <Row label="Razorpay payment id" value={o.razorpay_payment_id} />
          {o.failure_reason ? <Row label="Failure reason" value={o.failure_reason} /> : null}
        </Card>

        <Card>
          <CardHeader title="Notes" />
          {admin.perms.orders.edit ? (
            <OrderNotesForm action={saveOrderNotes.bind(null, o.id)} initial={o.admin_notes ?? ''} />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-ink-muted">{o.admin_notes || 'No notes.'}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
