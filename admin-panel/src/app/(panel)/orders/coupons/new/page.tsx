import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { CouponForm } from '../CouponForm';
import { createCoupon } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Coupon · CampusEduX Admin' };

export default async function NewCouponPage() {
  const admin = await requireModule('orders');
  if (!admin.perms.orders.add) redirect('/orders/coupons?error=no_access');
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Add Coupon" subtitle="Create a discount code." />
      <CouponForm mode="create" action={createCoupon} cancelHref="/orders/coupons" />
    </div>
  );
}
