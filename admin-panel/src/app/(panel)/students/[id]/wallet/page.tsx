import { PermissionGate } from '@/components/auth/PermissionGate';
import { MONEY_RPC_ROLES } from '@/lib/permission-gate';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Pagination } from '@/components/ui/Pagination';
import { formatINR, formatDateTime } from '@/lib/utils';
import { safe } from '@/lib/utils';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { WalletAdjustForm } from './WalletAdjustForm';
import { adjustStudentWallet } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Wallet · CampusEduX Admin' };

const SIZE = 15;

export default async function StudentWalletPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const admin = await requireModule('students');
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * SIZE;

  const [allTx, pageRes] = await Promise.all([
    safe(
      supabase.from('wallet_transactions').select('type, amount').eq('user_id', params.id),
      [] as { type: string; amount: number }[],
    ),
    supabase
      .from('wallet_transactions')
      .select('id, type, category, amount, description, created_at', { count: 'estimated' })
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .range(from, from + SIZE - 1),
  ]);

  const balance = allTx.reduce((s, t) => s + (t.type === 'credit' ? 1 : -1) * (Number(t.amount) || 0), 0);
  const credited = allTx.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const debited = allTx.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const rows = pageRes.error ? [] : (pageRes.data ?? []);
  const total = pageRes.error ? 0 : pageRes.count ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Balance" value={formatINR(balance)} icon={Wallet} tone="brand" />
        <StatCard label="Total credited" value={formatINR(credited)} icon={ArrowUpRight} tone="success" />
        <StatCard label="Total debited" value={formatINR(debited)} icon={ArrowDownRight} tone="danger" />
      </div>

      {/* UI gating only; the action needs students:edit and the RPC needs referrals:edit + super_admin/admin. */}
      <PermissionGate
        can={[
          { module: 'students', action: 'edit' },
          { module: 'referrals', action: 'edit' },
        ]}
        roles={MONEY_RPC_ROLES}
        mode="disable"
        block
      >
        <Card>
          <CardHeader title="Adjust balance" description="Writes a real wallet_transactions row via the admin_adjust_wallet function." />
          <WalletAdjustForm action={adjustStudentWallet.bind(null, params.id)} />
        </Card>
      </PermissionGate>

      <Card>
        <CardHeader title="Transaction history" />
        {rows.length === 0 ? (
          <EmptyState title="No transactions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t: any) => (
                  <tr key={t.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <Badge label={t.type} tone={t.type === 'credit' ? 'success' : 'danger'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{String(t.category).replace(/_/g, ' ')}</td>
                    <td className="py-2.5 text-ink-muted">{t.description || '—'}</td>
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
        <div className="mt-3">
          <Pagination page={page} pageSize={SIZE} total={total} basePath={`/students/${params.id}/wallet`} />
        </div>
      </Card>
    </div>
  );
}
