import Link from 'next/link';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { Pagination } from '@/components/ui/Pagination';
import { formatINR, formatDateTime } from '@/lib/utils';

interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  coupon_code: string | null;
  failure_reason: string | null;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  profile: { full_name: string; email: string } | null;
  project: { title: string } | null;
}

export function OrdersTable({
  rows,
  total,
  page,
  pageSize,
  basePath,
  searchParams = {},
  showFailureReason = false,
  missing = false,
}: {
  rows: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  showFailureReason?: boolean;
  missing?: boolean;
}) {
  return (
    <Card>
      {rows.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={missing ? 'The purchases table isn’t available yet — apply the mobile migrations.' : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Method</th>
                <th className="pb-2 font-medium">Status</th>
                {showFailureReason ? <th className="pb-2 font-medium">Reason</th> : null}
                <th className="pb-2 font-medium">Placed</th>
                <th className="pb-2 text-right font-medium">View</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-border odd:bg-surface-subtle/40">
                  <td className="py-2.5">
                    <p className="font-medium text-ink">{o.profile?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-ink-faint">{o.profile?.email}</p>
                  </td>
                  <td className="py-2.5 text-ink-muted">{o.project?.title || '—'}</td>
                  <td className="py-2.5 font-mono">{formatINR(Number(o.total_amount))}</td>
                  <td className="py-2.5 text-ink-muted">{o.payment_method || (o.razorpay_payment_id ? 'Razorpay' : '—')}</td>
                  <td className="py-2.5">
                    <StatusPill status={o.status} />
                  </td>
                  {showFailureReason ? <td className="py-2.5 text-ink-muted">{o.failure_reason || '—'}</td> : null}
                  <td className="py-2.5 text-ink-muted">{formatDateTime(o.created_at)}</td>
                  <td className="py-2.5 text-right">
                    <Link href={`/orders/${o.id}`} className="font-medium text-brand hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <Pagination page={page} pageSize={pageSize} total={total} basePath={basePath} searchParams={searchParams} />
      </div>
    </Card>
  );
}
