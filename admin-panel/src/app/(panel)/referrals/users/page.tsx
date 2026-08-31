import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { formatINR, formatDate } from '@/lib/utils';
import { listReferralUsers, REFERRAL_PAGE_SIZE } from '@/lib/referrals/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referral Users · CampusEduX Admin' };

export default async function ReferralUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  await requireModule('referrals');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status ?? '';
  const { rows, total, missing } = await listReferralUsers({ page, status });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/referrals" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Referral & Wallet
        </Link>
        <PageHeader title="Referral Users" subtitle="Students who joined through someone’s referral code." />
      </div>

      <SearchFilterBar
        placeholder="(filter by status)"
        filters={
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: 'successful', label: 'Successful' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No referred users" description={missing ? 'The referrals table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Referred user</th>
                  <th className="pb-2 font-medium">Referred by</th>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Reward</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{r.referred_user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{r.referred_user?.email}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{r.referrer?.full_name || r.referrer?.email || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{r.source || 'link'}</td>
                    <td className="py-2.5 font-mono">{r.reward_amount ? formatINR(Number(r.reward_amount)) : '—'}</td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={REFERRAL_PAGE_SIZE} total={total} basePath="/referrals/users" searchParams={{ status }} />
        </div>
      </Card>
    </div>
  );
}
