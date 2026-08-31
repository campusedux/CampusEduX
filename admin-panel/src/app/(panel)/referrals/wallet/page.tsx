import Link from 'next/link';
import { ArrowLeft, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { formatINR, formatINRCompact, formatDateTime } from '@/lib/utils';
import { getPlatformWallet } from '@/lib/referrals/queries';
import { WalletAdjustPanel } from './WalletAdjustPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Platform Wallet · CampusEduX Admin' };

export default async function PlatformWalletPage() {
  const admin = await requireModule('referrals');
  const w = await getPlatformWallet();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/referrals" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Referral & Wallet
        </Link>
        <PageHeader title="Wallet" subtitle="Platform-wide wallet balance across all students." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total balance" value={formatINRCompact(w.total)} icon={Wallet} tone="brand" />
        <StatCard label="Available" value={formatINRCompact(w.available)} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending withdrawals" value={formatINRCompact(w.pending)} icon={Clock} tone="warning" />
      </div>

      {admin.perms.referrals.edit ? <WalletAdjustPanel /> : null}

      <Card>
        <CardHeader title="Recent transactions" />
        {w.recent.length === 0 ? (
          <EmptyState title="No transactions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {w.recent.map((t: any) => (
                  <tr key={t.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">{t.user?.full_name || t.user?.email || 'Unknown'}</td>
                    <td className="py-2.5">
                      <Badge label={t.type} tone={t.type === 'credit' ? 'success' : 'danger'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{String(t.category).replace(/_/g, ' ')}</td>
                    <td className="py-2.5 font-mono">
                      {t.type === 'credit' ? '+' : '−'}
                      {formatINR(Number(t.amount))}
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
