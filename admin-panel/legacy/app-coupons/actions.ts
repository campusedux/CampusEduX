'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser, requirePermission } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export interface CouponFormValues {
  code: string;
  discountType: 'flat' | 'percentage';
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number;
  validUntil: string | null; // yyyy-mm-dd from an <input type="date">
  isActive: boolean;
}

export async function createCoupon(values: CouponFormValues) {
  const staff = await requireStaffUser();
  await requirePermission('coupons', 'update');

  const supabase = createClient();
  const { data: coupon, error } = await supabase
    .from('coupons')
    .insert({
      code: values.code.toUpperCase(),
      discount_type: values.discountType,
      value: values.value,
      min_purchase: values.minPurchase,
      max_discount: values.maxDiscount,
      usage_limit: values.usageLimit,
      per_user_limit: values.perUserLimit,
      valid_until: values.validUntil,
      is_active: values.isActive,
      created_by: staff.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'coupon.create',
    resourceType: 'coupons',
    resourceId: coupon.id,
    newValue: values,
  });

  revalidatePath('/coupons');
  redirect('/coupons');
}

export async function updateCoupon(couponId: string, values: CouponFormValues) {
  const staff = await requireStaffUser();
  await requirePermission('coupons', 'update');

  const supabase = createClient();
  const { data: before } = await supabase.from('coupons').select('*').eq('id', couponId).single();

  const { error } = await supabase
    .from('coupons')
    .update({
      code: values.code.toUpperCase(),
      discount_type: values.discountType,
      value: values.value,
      min_purchase: values.minPurchase,
      max_discount: values.maxDiscount,
      usage_limit: values.usageLimit,
      per_user_limit: values.perUserLimit,
      valid_until: values.validUntil,
      is_active: values.isActive,
    })
    .eq('id', couponId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'coupon.update',
    resourceType: 'coupons',
    resourceId: couponId,
    oldValue: before,
    newValue: values,
  });

  revalidatePath('/coupons');
  redirect('/coupons');
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  const staff = await requireStaffUser();
  await requirePermission('coupons', 'update');

  const supabase = createClient();
  const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', couponId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'coupon.activate' : 'coupon.deactivate',
    resourceType: 'coupons',
    resourceId: couponId,
  });

  revalidatePath('/coupons');
}
