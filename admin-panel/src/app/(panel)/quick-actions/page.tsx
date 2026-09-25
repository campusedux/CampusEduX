import Link from 'next/link';
import {
  FolderPlus,
  BriefcaseBusiness,
  UserPlus,
  ShoppingCart,
  Users,
  Tags,
  TicketPercent,
  Send,
  Settings,
} from 'lucide-react';
import { requireModule } from '@/lib/auth';
import type { AdminRole, ModuleKey, PermAction } from '@/lib/permissions';
import { MONEY_RPC_ROLES, evaluateGate } from '@/lib/permission-gate';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/primitives';
import { formatINRCompact, formatNumber } from '@/lib/utils';
import { getKpis } from '@/lib/dashboard/metrics';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quick Actions · CampusEduX Admin' };

const TILES: {
  label: string;
  href: string;
  icon: typeof FolderPlus;
  module: ModuleKey;
  action?: PermAction;
  roles?: readonly AdminRole[];
}[] = [
  { label: 'Add Project', href: '/projects/new', icon: FolderPlus, module: 'projects' as const, action: 'add' as const },
  { label: 'Add Job', href: '/jobs/new', icon: BriefcaseBusiness, module: 'jobs' as const, action: 'add' as const },
  { label: 'Add User', href: '/students/new', icon: UserPlus, module: 'students' as const, action: 'add' as const },
  { label: 'Manage Orders', href: '/orders', icon: ShoppingCart, module: 'orders' as const },
  { label: 'Manage Users', href: '/students', icon: Users, module: 'students' as const },
  { label: 'Manage Categories', href: '/settings/categories', icon: Tags, module: 'settings' as const },
  { label: 'Coupons & Offers', href: '/orders/coupons', icon: TicketPercent, module: 'orders' as const },
  { label: 'Send Notification', href: '/cms/notifications', icon: Send, module: 'cms' as const, action: 'add' as const, roles: MONEY_RPC_ROLES },
  { label: 'Site Settings', href: '/settings', icon: Settings, module: 'settings' as const },
];

export default async function QuickActionsPage() {
  const admin = await requireModule('dashboard');
  const kpis = await getKpis();

  // UI gating only (server enforces): "Add …" tiles need :add; broadcast needs the RPC role guard too.
  const tiles = TILES.filter((t) => {
    return evaluateGate(admin.perms, admin.role, {
      can: { module: t.module, action: t.action ?? 'view' },
      roles: t.roles,
    }).allowed;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Quick Actions" subtitle="Jump straight to the things you do most." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-start gap-3 rounded-card border border-border bg-white p-5 shadow-sm transition-colors hover:border-brand hover:bg-brand-light/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark group-hover:bg-brand group-hover:text-white">
              <Icon size={18} />
            </span>
            <span className="text-sm font-semibold text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <Card>
        <h3 className="text-base font-semibold text-ink">Platform Summary</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Students', value: formatNumber(kpis.students) },
            { label: 'Projects', value: formatNumber(kpis.projects) },
            { label: 'Jobs', value: formatNumber(kpis.jobs) },
            { label: 'Orders (MTD)', value: formatNumber(kpis.orders.current) },
            { label: 'Revenue (MTD)', value: formatINRCompact(kpis.revenue.current) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-surface-subtle p-3">
              <p className="text-xs font-medium text-ink-muted">{s.label}</p>
              <p className="mt-1 text-lg font-bold text-ink">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
