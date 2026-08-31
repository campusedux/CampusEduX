import Link from 'next/link';
import { ShoppingCart, CheckCircle2, XCircle, Clock, Undo2, IndianRupee } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { OrdersTable } from './OrdersTable';
import { formatINRCompact, formatNumber } from '@/lib/utils';
import { listOrders, getOrderStats, ORDER_PAGE_SIZE } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders & Payments · CampusEduX Admin' };

const NAV = [
  { href: '/orders/successful', label: 'Successful' },
  { href: '/orders/failed', label: 'Failed' },
  { href: '/orders/refunds', label: 'Refunds' },
  { href: '/orders/coupons', label: 'Coupons' },
  { href: '/orders/offers', label: 'Offers' },
  { href: '/orders/transactions', label: 'Transactions' },
  { href: '/orders/wallet-requests', label: 'Wallet Requests' },
  { href: '/orders/revenue', label: 'Revenue' },
  { href: '/orders/monthly', label: 'Monthly Reports' },
  { href: '/orders/analytics', label: 'Payment Analytics' },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string };
}) {
  await requireModule('orders');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';

  const [{ rows, total, missing }, stats] = await Promise.all([listOrders({ page, q, status }), getOrderStats()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & Payments"
        subtitle="Every purchase, payment, refund and coupon."
        action={
          <div className="flex flex-wrap gap-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                <Button variant="secondary" size="sm">
                  {n.label}
                </Button>
              </Link>
            ))}
          </div>
        }
      />

      <SearchFilterBar
        placeholder="Search coupon or Razorpay id…"
        filters={
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: 'success', label: 'Success' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Orders" value={formatNumber(stats.total)} icon={ShoppingCart} />
        <StatCard label="Successful" value={formatNumber(stats.success)} icon={CheckCircle2} tone="success" />
        <StatCard label="Failed" value={formatNumber(stats.failed)} icon={XCircle} tone="danger" />
        <StatCard label="Pending" value={formatNumber(stats.pending)} icon={Clock} tone="warning" />
        <StatCard label="Refunded" value={formatNumber(stats.refunded)} icon={Undo2} tone="info" />
        <StatCard label="Revenue" value={formatINRCompact(stats.revenue)} icon={IndianRupee} tone="success" />
      </div>

      <OrdersTable
        rows={rows as any}
        total={total}
        page={page}
        pageSize={ORDER_PAGE_SIZE}
        basePath="/orders"
        searchParams={{ q, status }}
        missing={missing}
      />
    </div>
  );
}
