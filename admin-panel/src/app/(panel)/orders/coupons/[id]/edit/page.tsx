import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { CouponForm } from '../../CouponForm';
import { updateCoupon } from '../../../actions';
import { getCoupon } from '@/lib/orders/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Coupon · CampusEduX Admin' };

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('orders');
  if (!admin.perms.orders.edit) redirect('/orders/coupons?error=no_access');
  const coupon = await getCoupon(params.id);
  if (!coupon) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit Coupon" subtitle={coupon.code} />
      <CouponForm mode="edit" action={updateCoupon.bind(null, params.id)} initial={coupon} cancelHref="/orders/coupons" />
    </div>
  );
}
