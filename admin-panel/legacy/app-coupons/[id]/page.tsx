import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader } from '@/components/ui/primitives';
import { CouponForm } from '@/app/coupons/CouponForm';

export const dynamic = 'force-dynamic';

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: coupon } = await supabase.from('coupons').select('*').eq('id', params.id).single();
  if (!coupon) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-ink">{coupon.code}</h1>
        <p className="text-sm text-ink-muted">Used {coupon.times_used} time{coupon.times_used === 1 ? '' : 's'}</p>
      </div>
      <Card>
        <CardHeader title="Details" />
        <CouponForm
          couponId={coupon.id}
          initialValues={{
            code: coupon.code,
            discountType: coupon.discount_type,
            value: Number(coupon.value),
            minPurchase: Number(coupon.min_purchase),
            maxDiscount: coupon.max_discount === null ? null : Number(coupon.max_discount),
            usageLimit: coupon.usage_limit,
            perUserLimit: coupon.per_user_limit,
            validUntil: coupon.valid_until ? coupon.valid_until.slice(0, 10) : null,
            isActive: coupon.is_active,
          }}
        />
      </Card>
    </div>
  );
}
