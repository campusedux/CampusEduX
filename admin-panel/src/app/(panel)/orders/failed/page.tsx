import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { OrdersTable } from '../OrdersTable';
import { listOrders, ORDER_PAGE_SIZE } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Failed Payments · CampusEduX Admin' };

export default async function FailedPaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  await requireModule('orders');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const { rows, total, missing } = await listOrders({ page, q, status: 'failed' });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Failed Payments" subtitle="Purchases that didn’t complete, with the failure reason." />
      </div>
      <SearchFilterBar placeholder="Search…" />
      <OrdersTable
        rows={rows as any}
        total={total}
        page={page}
        pageSize={ORDER_PAGE_SIZE}
        basePath="/orders/failed"
        searchParams={{ q }}
        showFailureReason
        missing={missing}
      />
    </div>
  );
}
