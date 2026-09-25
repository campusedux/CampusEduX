import { PermissionGate } from '@/components/auth/PermissionGate';
import { MONEY_RPC_ROLES } from '@/lib/permission-gate';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { DecisionButtons } from '@/components/ui/DecisionButtons';
import { formatINR, formatDateTime } from '@/lib/utils';
import { listWithdrawalRequests, WITHDRAWAL_PAGE_SIZE } from '@/lib/wallet/withdrawals';
import { decideWithdrawal } from './actions';

/** Shared "Wallet Requests" screen — rendered from both Module 8 and Module 9. */
export async function WithdrawalQueue({
  basePath,
  searchParams,
}: {
  basePath: string;
  searchParams: { page?: string; status?: string };
}) {
  await requireModule('referrals');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status ?? '';
  const { rows, total, missing } = await listWithdrawalRequests({ page, status });

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet Requests" subtitle="Withdrawal queue — approving debits the user’s wallet in one transaction." />

      <SearchFilterBar
        placeholder="(filter by status)"
        filters={
          <FilterSelect
            name="status"
            label="Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No withdrawal requests" description={missing ? 'The withdrawal_requests table isn’t available — apply admin migration 007.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Requested</th>
                  <th className="pb-2 text-right font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border align-top odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{r.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{r.user?.email}</p>
                    </td>
                    <td className="py-2.5 font-mono">{formatINR(Number(r.amount))}</td>
                    <td className="py-2.5 text-ink-muted">
                      {r.method}
                      {r.account_details && Object.keys(r.account_details).length ? (
                        <span className="block text-xs text-ink-faint">
                          {Object.values(r.account_details).join(' · ')}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                      {r.decision_note ? <p className="mt-1 text-xs text-ink-faint">{r.decision_note}</p> : null}
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(r.created_at)}</td>
                    <td className="py-2.5 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex justify-end">
                          {/* action needs orders:edit; RPC needs referrals:edit + super_admin/admin */}
                          <PermissionGate
                            can={[
                              { module: 'orders', action: 'edit' },
                              { module: 'referrals', action: 'edit' },
                            ]}
                            roles={MONEY_RPC_ROLES}
                            mode="disable"
                          >
                            <DecisionButtons action={decideWithdrawal.bind(null, r.id)} />
                          </PermissionGate>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">
                          {r.decided_at ? `decided ${formatDateTime(r.decided_at)}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={WITHDRAWAL_PAGE_SIZE} total={total} basePath={basePath} searchParams={{ status }} />
        </div>
      </Card>
    </div>
  );
}
