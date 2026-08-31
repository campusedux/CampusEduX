import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, Badge, StatusPill, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { FlashToast } from '@/components/ui/FlashToast';
import { formatINR, formatDate, formatNumber } from '@/lib/utils';
import { getCoupons } from '@/lib/orders/queries';
import { deleteCoupon, toggleCouponStatus } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Coupons · CampusEduX Admin' };

export default async function CouponsPage({ searchParams }: { searchParams: { created?: string; saved?: string } }) {
  const admin = await requireModule('orders');
  const coupons = await getCoupons();

  return (
    <div className="space-y-6">
      {searchParams.created ? <FlashToast title="Coupon created" /> : null}
      {searchParams.saved ? <FlashToast title="Coupon saved" /> : null}

      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader
          title="Coupons"
          subtitle="Discount codes applied at checkout."
          action={
            admin.perms.orders.add ? (
              <Link href="/orders/coupons/new">
                <Button>
                  <Plus size={16} /> Add Coupon
                </Button>
              </Link>
            ) : null
          }
        />
      </div>

      <Card>
        {coupons.length === 0 ? (
          <EmptyState title="No coupons yet" description="Apply admin migration 007, or add one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Discount</th>
                  <th className="pb-2 font-medium">Min order</th>
                  <th className="pb-2 font-medium">Usage</th>
                  <th className="pb-2 font-medium">Valid till</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: any) => (
                  <tr key={c.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <span className="font-mono font-medium text-ink">{c.code}</span>
                      {c.description ? <p className="text-xs text-ink-faint">{c.description}</p> : null}
                    </td>
                    <td className="py-2.5 text-ink-muted">
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : formatINR(Number(c.discount_value))}
                      {c.max_discount ? <span className="text-xs text-ink-faint"> · cap {formatINR(Number(c.max_discount))}</span> : null}
                    </td>
                    <td className="py-2.5 text-ink-muted">{c.min_order ? formatINR(Number(c.min_order)) : '—'}</td>
                    <td className="py-2.5 text-ink-muted">
                      {formatNumber(c.used_count)}
                      {c.usage_limit ? ` / ${formatNumber(c.usage_limit)}` : ''}
                    </td>
                    <td className="py-2.5 text-ink-muted">{c.valid_till ? formatDate(c.valid_till) : '—'}</td>
                    <td className="py-2.5">
                      {admin.perms.orders.edit && c.status !== 'expired' ? (
                        <ToggleSwitch checked={c.status === 'active'} action={toggleCouponStatus.bind(null, c.id)} />
                      ) : (
                        <StatusPill status={c.status} />
                      )}
                    </td>
                    <td className="py-2.5">
                      <RowActions
                        editHref={admin.perms.orders.edit ? `/orders/coupons/${c.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.orders.delete ? (
                            <DeleteButton action={deleteCoupon.bind(null, c.id)} confirmMessage={`Delete coupon ${c.code}?`} />
                          ) : null
                        }
                      />
                    </td>
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
