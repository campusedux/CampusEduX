import { IndianRupee, ShoppingCart, Users, LifeBuoy, Star, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/ui/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { Card, CardHeader, Badge } from '@/components/ui/primitives';
import { formatDateTime, formatINR } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getMetrics() {
  const supabase = createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [
    { data: paidOrders },
    { count: todayOrderCount },
    { count: userCount },
    { count: pendingReviewCount },
    { count: openTicketCount },
    { count: pendingRefundCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('total_amount, created_at').eq('status', 'paid').gte('created_at', fourteenDaysAgo.toISOString()),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid').gte('created_at', startOfToday.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('refunds').select('id', { count: 'exact', head: true }).eq('status', 'requested'),
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at, user_profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const totalRevenue14d = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total_amount), 0);

  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    revenueByDay.set(d.toISOString().slice(0, 10), 0);
  }
  (paidOrders ?? []).forEach((o) => {
    const key = o.created_at.slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(o.total_amount));
  });
  const chartData = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: Math.round(revenue),
  }));

  return {
    totalRevenue14d,
    todayOrderCount: todayOrderCount ?? 0,
    userCount: userCount ?? 0,
    pendingReviewCount: pendingReviewCount ?? 0,
    openTicketCount: openTicketCount ?? 0,
    pendingRefundCount: pendingRefundCount ?? 0,
    recentOrders: recentOrders ?? [],
    chartData,
  };
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
  cancelled: 'neutral',
};

export default async function DashboardPage() {
  const metrics = await getMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Last 14 days at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Revenue (14d)" value={formatINR(metrics.totalRevenue14d)} icon={IndianRupee} />
        <StatCard label="Orders today" value={String(metrics.todayOrderCount)} icon={ShoppingCart} />
        <StatCard label="Total users" value={metrics.userCount.toLocaleString('en-IN')} icon={Users} />
        <StatCard
          label="Pending reviews"
          value={String(metrics.pendingReviewCount)}
          icon={Star}
          tone={metrics.pendingReviewCount > 0 ? 'warning' : 'brand'}
        />
        <StatCard
          label="Open tickets"
          value={String(metrics.openTicketCount)}
          icon={LifeBuoy}
          tone={metrics.openTicketCount > 0 ? 'warning' : 'brand'}
        />
      </div>

      {metrics.pendingRefundCount > 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-ink">
          <Undo2 size={16} className="text-warning" />
          <span>
            <strong>{metrics.pendingRefundCount}</strong> refund request{metrics.pendingRefundCount === 1 ? '' : 's'}{' '}
            waiting for review.
          </span>
          <Link href="/orders?tab=refunds" className="ml-auto font-medium text-brand hover:underline">
            Review now
          </Link>
        </div>
      ) : null}

      <Card>
        <CardHeader title="Revenue trend" description="Paid orders, last 14 days" />
        <RevenueChart data={metrics.chartData} />
      </Card>

      <Card>
        <CardHeader title="Recent orders" action={<Link href="/orders" className="text-sm font-medium text-brand hover:underline">View all</Link>} />
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
            {metrics.recentOrders.map((order: any) => (
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
        {metrics.recentOrders.length === 0 ? <p className="py-6 text-center text-sm text-ink-muted">No orders yet.</p> : null}
      </Card>
    </div>
  );
}
