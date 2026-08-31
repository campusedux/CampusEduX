import { Card, CardHeader } from '@/components/ui/primitives';
import { CouponForm } from '@/app/coupons/CouponForm';

export default function NewCouponPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">New coupon</h1>
      </div>
      <Card>
        <CardHeader title="Details" />
        <CouponForm />
      </Card>
    </div>
  );
}
