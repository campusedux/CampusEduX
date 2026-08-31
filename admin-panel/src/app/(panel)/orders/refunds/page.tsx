import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { DecisionButtons } from '@/components/ui/DecisionButtons';
import { formatINR, formatDateTime } from '@/lib/utils';
import { listRefundRequests, ORDER_PAGE_SIZE } from '@/lib/orders/queries';
import { decideRefund } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Refund Requests · CampusEduX Admin' };

export default async function RefundRequestsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const admin = await requireModule('orders');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status ?? '';
  const { rows, total, missing } = await listRefundRequests({ page, status });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Refund Requests" subtitle="Approving credits the buyer’s wallet and marks the order refunded — in one transaction." />
      </div>

      <SearchFilterBar
        placeholder="(filter by status)"
        filters={
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No refund requests" description={missing ? 'The refund_requests table isn’t available — apply admin migration 007.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Requested</th>
                  <th className="pb-2 text-right font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border align-top odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{r.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{r.user?.email}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{r.purchase?.project?.title || '—'}</td>
                    <td className="py-2.5 font-mono">
                      {formatINR(Number(r.amount))}
                      <Badge label={`to ${r.refund_to}`} tone="neutral" />
                    </td>
                    <td className="max-w-xs py-2.5 text-ink-muted">{r.reason || '—'}</td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                      {r.decision_note ? <p className="mt-1 text-xs text-ink-faint">{r.decision_note}</p> : null}
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(r.created_at)}</td>
                    <td className="py-2.5 text-right">
                      {r.status === 'pending' && admin.perms.orders.edit ? (
                        <div className="flex justify-end">
                          <DecisionButtons action={decideRefund.bind(null, r.id)} />
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">
                          {r.decided_at ? `decided ${formatDateTime(r.decided_at)}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={ORDER_PAGE_SIZE} total={total} basePath="/orders/refunds" searchParams={{ status }} />
        </div>
      </Card>
    </div>
  );
}
