import Link from 'next/link';
import { requireStaffUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { WalletAdjustForm } from '@/app/referrals/WalletAdjustForm';

export const dynamic = 'force-dynamic';

const REFERRAL_STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  pending: 'warning',
  fraud_blocked: 'danger',
};

const WALLET_SOURCE_LABEL: Record<string, string> = {
  referral: 'Referral reward',
  cashback: 'Cashback',
  admin_credit: 'Admin adjustment',
  bonus: 'Bonus',
  order_payment: 'Order payment',
  refund: 'Refund',
};

export default async function ReferralsPage() {
  const staff = await requireStaffUser();
  const isAdmin = staff.roleId === 'admin' || staff.roleId === 'super_admin';

  // Same restriction as /users — wallet_transactions and referrals RLS
  // (006_referral_wallet.sql) only lets is_admin() read rows besides one's
  // own, so a content_editor/manager session would just get an empty result
  // here anyway. Reward *settings* stay editable by managers under /settings.
  if (!isAdmin) {
    return (
      <Card>
        <EmptyState
          title="Admins only"
          description="Only Admin and Super Admin accounts can view referral activity and the wallet ledger. Reward amount/rules are still editable by managers under Settings."
        />
      </Card>
    );
  }

  const supabase = createClient();

  const [{ data: referrals, error: referralsError }, { data: transactions, error: transactionsError }] =
    await Promise.all([
      supabase
        .from('referrals')
        .select(
          'id, status, created_at, completed_at, referrer:referrer_id(full_name, email), referred:referred_user_id(full_name, email)',
        )
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('wallet_transactions')
        .select('id, amount, direction, source, description, created_at, user:user_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
  if (referralsError) throw new Error(referralsError.message);
  if (transactionsError) throw new Error(transactionsError.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Referrals & Wallet</h1>
          <p className="text-sm text-ink-muted">
            Referral activity and the wallet ledger are read-only here (crediting happens automatically). Reward
            amount, type, and validity are configured under{' '}
            <Link href="/settings" className="text-brand hover:underline">
              Settings
            </Link>
            .
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Manual wallet adjustment" description="Use for corrections — every entry is a new, traceable ledger row." />
        <WalletAdjustForm />
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardHeader title="Recent referrals" description="Last 100, newest first." />
        </div>
        {!referrals || referrals.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No referrals yet" description="Referrals will appear here once students start inviting friends." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Referrer</th>
                <th className="px-5 py-3 font-medium">Referred user</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {referrals.map((referral: any) => (
                <tr key={referral.id}>
                  <td className="px-5 py-3 text-ink">{referral.referrer?.full_name ?? referral.referrer?.email ?? '—'}</td>
                  <td className="px-5 py-3 text-ink">{referral.referred?.full_name ?? referral.referred?.email ?? '—'}</td>
                  <td className="px-5 py-3">
                    <Badge label={referral.status} tone={REFERRAL_STATUS_TONE[referral.status] ?? 'neutral'} />
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{formatDate(referral.created_at)}</td>
                  <td className="px-5 py-3 text-ink-muted">{referral.completed_at ? formatDate(referral.completed_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-0">
          <CardHeader title="Wallet ledger" description="Last 100 entries across all users, newest first." />
        </div>
        {!transactions || transactions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No wallet activity yet" description="Credits and debits will appear here as they happen." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="px-5 py-3 text-ink">{tx.user?.full_name ?? tx.user?.email ?? '—'}</td>
                  <td className={`px-5 py-3 font-medium ${tx.direction === 'credit' ? 'text-success' : 'text-danger'}`}>
                    {tx.direction === 'credit' ? '+' : '-'}₹{tx.amount}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{WALLET_SOURCE_LABEL[tx.source] ?? tx.source}</td>
                  <td className="px-5 py-3 text-ink-muted">{tx.description ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
