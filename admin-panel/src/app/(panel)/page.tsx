import { Suspense } from 'react';
import Link from 'next/link';
import { Users, ShoppingCart, IndianRupee, GraduationCap, FolderKanban, Briefcase } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, StatusPill, EmptyState } from '@/components/ui/primitives';
import { ChartSkeleton, TableSkeleton, StatGridSkeleton } from '@/components/ui/Skeleton';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatINRCompact, formatINR, formatNumber, formatDateTime, timeAgo } from '@/lib/utils';
import {
  getOverviewSeries,
  getKpis,
  getTopCategories,
  getRecentOrders,
  getRecentUsers,
} from '@/lib/dashboard/metrics';

export const dynamic = 'force-dynamic';

/**
 * The shell (welcome banner) renders immediately after the admin lookup; every
 * data section below is its own <Suspense> boundary, so the KPI row, the chart,
 * top categories and the two tables each stream in independently as their query
 * resolves instead of the whole page blocking on the slowest one.
 */
export default async function DashboardHome() {
  const admin = await requireAdmin();
  const firstName = admin.fullName.split(' ')[0];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-card bg-gradient-to-r from-[#1E1550] to-brand p-6 text-white">
        <p className="text-sm text-white/70">Welcome back,</p>
        <h1 className="mt-0.5 text-2xl font-bold">{firstName} 👋</h1>
        <p className="mt-1 max-w-xl text-sm text-white/70">
          Here&apos;s how CampusEduX is doing this month. Jump into a section from the sidebar or the quick actions.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/quick-actions" className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25">
            Quick actions
          </Link>
          <Link href="/analytics" className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25">
            Full analytics
          </Link>
        </div>
      </div>

      <Suspense fallback={<StatGridSkeleton count={6} />}>
        <KpiRow />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Overview" description="New users, successful orders and revenue — last 30 days" />
          <Suspense fallback={<ChartSkeleton height={280} />}>
            <OverviewChart />
          </Suspense>
        </Card>
        <Card>
          <CardHeader title="Top categories" description="By number of projects" />
          <Suspense fallback={<ChartSkeleton />}>
            <TopCategoriesChart />
          </Suspense>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent orders"
            action={
              <Link href="/recent-orders" className="text-sm font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          <Suspense fallback={<TableSkeleton />}>
            <RecentOrders />
          </Suspense>
        </Card>

        <Card>
          <CardHeader
            title="New users"
            action={
              <Link href="/recent-users" className="text-sm font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          <Suspense fallback={<TableSkeleton />}>
            <RecentUsers />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

async function KpiRow() {
  const kpis = await getKpis();
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Revenue (MTD)"
        value={formatINRCompact(kpis.revenue.current)}
        icon={IndianRupee}
        tone="success"
        current={kpis.revenue.current}
        previous={kpis.revenue.previous}
      />
      <StatCard
        label="Orders (MTD)"
        value={formatNumber(kpis.orders.current)}
        icon={ShoppingCart}
        current={kpis.orders.current}
        previous={kpis.orders.previous}
      />
      <StatCard
        label="New users (MTD)"
        value={formatNumber(kpis.users.current)}
        icon={Users}
        tone="info"
        current={kpis.users.current}
        previous={kpis.users.previous}
      />
      <StatCard label="Total students" value={formatNumber(kpis.students)} icon={GraduationCap} hint="all time" />
      <StatCard label="Projects" value={formatNumber(kpis.projects)} icon={FolderKanban} hint="in catalogue" />
      <StatCard label="Jobs" value={formatNumber(kpis.jobs)} icon={Briefcase} tone="warning" hint="listed" />
    </div>
  );
}

async function OverviewChart() {
  const series = await getOverviewSeries(30);
  return (
    <TrendChart
      data={series}
      series={[
        { key: 'users', label: 'Users', color: '#2563EB' },
        { key: 'orders', label: 'Orders', color: '#4F39F6' },
        { key: 'revenue', label: 'Revenue (₹)', color: '#16A34A' },
      ]}
    />
  );
}

async function TopCategoriesChart() {
  const topCategories = await getTopCategories(6);
  return <DonutChart data={topCategories} centerLabel="Projects" />;
}

async function RecentOrders() {
  const recentOrders = await getRecentOrders(6);
  if (recentOrders.length === 0) {
    return <EmptyState title="No orders yet" description="Successful purchases will show up here." />;
  }
  return (
    <div className="overflow-x-auto">
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
          {recentOrders.map((o: any) => (
            <tr key={o.id} className="border-t border-border">
              <td className="py-2.5">{o.profile?.full_name || o.profile?.email || 'Unknown'}</td>
              <td className="py-2.5 font-mono">{formatINR(Number(o.total_amount))}</td>
              <td className="py-2.5">
                <StatusPill status={o.status} />
              </td>
              <td className="py-2.5 text-ink-muted">{timeAgo(o.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function RecentUsers() {
  const recentUsers = await getRecentUsers(6);
  if (recentUsers.length === 0) {
    return <EmptyState title="No students yet" description="New sign-ups will show up here." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Course</th>
            <th className="pb-2 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {recentUsers.map((u: any) => (
            <tr key={u.id} className="border-t border-border">
              <td className="py-2.5">
                <p className="font-medium text-ink">{u.full_name || '—'}</p>
                <p className="text-xs text-ink-faint">{u.email}</p>
              </td>
              <td className="py-2.5 text-ink-muted">{[u.course, u.branch].filter(Boolean).join(' · ') || '—'}</td>
              <td className="py-2.5 text-ink-muted">{formatDateTime(u.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
