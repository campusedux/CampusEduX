import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatDate, formatINR } from '@/lib/utils';
import { ToggleActiveButton } from '@/app/coupons/ToggleActiveButton';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const supabase = createClient();
  const { data: coupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Coupons & Offers</h1>
          <p className="text-sm text-ink-muted">{(coupons ?? []).length} coupon{(coupons ?? []).length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/coupons/new">
          <Button>
            <Plus size={16} /> New coupon
          </Button>
        </Link>
      </div>

      <Card>
        {!coupons || coupons.length === 0 ? (
          <EmptyState title="No coupons yet" description="Create one to offer a discount at checkout." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Discount</th>
                <th className="pb-2 font-medium">Min. purchase</th>
                <th className="pb-2 font-medium">Used</th>
                <th className="pb-2 font-medium">Valid until</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-border">
                  <td className="py-2.5">
                    <Link href={`/coupons/${coupon.id}`} className="font-mono font-medium text-ink hover:text-brand hover:underline">
                      {coupon.code}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    {coupon.discount_type === 'flat' ? formatINR(Number(coupon.value)) : `${Number(coupon.value)}%`}
                    {coupon.max_discount ? <span className="text-ink-faint"> (cap {formatINR(Number(coupon.max_discount))})</span> : null}
                  </td>
                  <td className="py-2.5 text-ink-muted">{formatINR(Number(coupon.min_purchase))}</td>
                  <td className="py-2.5 text-ink-muted">
                    {coupon.times_used}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                  </td>
                  <td className="py-2.5 text-ink-muted">{coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}</td>
                  <td className="py-2.5">
                    <Badge label={coupon.is_active ? 'Active' : 'Inactive'} tone={coupon.is_active ? 'success' : 'neutral'} />
                  </td>
                  <td className="py-2.5 text-right">
                    <ToggleActiveButton couponId={coupon.id} isActive={coupon.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
