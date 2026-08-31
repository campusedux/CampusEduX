import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatINR, formatDateTime } from '@/lib/utils';
import { listTransactions, ORDER_PAGE_SIZE } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Transactions · CampusEduX Admin' };

const CATEGORIES = ['referral_bonus', 'added_money', 'project_purchase', 'mock_test_purchase', 'cashback', 'withdrawal'];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; type?: string; category?: string };
}) {
  await requireModule('orders');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const type = searchParams.type ?? '';
  const category = searchParams.category ?? '';
  const { rows, total, missing } = await listTransactions({ page, q, type, category });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Transactions" subtitle="Every wallet transaction across the platform." />
      </div>

      <SearchFilterBar
        placeholder="Search description…"
        filters={
          <>
            <FilterSelect name="type" label="Type" options={[{ value: 'credit', label: 'Credit' }, { value: 'debit', label: 'Debit' }]} />
            <FilterSelect
              name="category"
              label="Category"
              options={CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
            />
          </>
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No transactions" description={missing ? 'The wallet_transactions table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t: any) => (
                  <tr key={t.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{t.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{t.user?.email}</p>
                    </td>
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
          <Pagination page={page} pageSize={ORDER_PAGE_SIZE} total={total} basePath="/orders/transactions" searchParams={{ q, type, category }} />
        </div>
      </Card>
    </div>
  );
}
