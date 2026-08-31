import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { OrdersTable } from '../OrdersTable';
import { listOrders, ORDER_PAGE_SIZE } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Successful Payments · CampusEduX Admin' };

export default async function SuccessfulPaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; from?: string; to?: string };
}) {
  await requireModule('orders');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const { from = '', to = '' } = searchParams;
  const { rows, total, missing } = await listOrders({ page, q, status: 'success', from, to });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Successful Payments" subtitle="Completed purchases." />
      </div>
      <SearchFilterBar placeholder="Search…" filters={<DateRangePicker />} />
      <OrdersTable
        rows={rows as any}
        total={total}
        page={page}
        pageSize={ORDER_PAGE_SIZE}
        basePath="/orders/successful"
        searchParams={{ q, from, to }}
        missing={missing}
      />
    </div>
  );
}
