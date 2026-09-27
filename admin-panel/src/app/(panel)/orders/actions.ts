'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => {
  const v = s(fd, k);
  return v === '' ? null : Number(v);
};
const nz = (fd: FormData, k: string) => Number(s(fd, k) || 0);

// --- order notes ---------------------------------------------------
export async function saveOrderNotes(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('orders', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('purchases').update({ admin_notes: s(fd, 'admin_notes') || null }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'order.notes', module: 'orders', resourceType: 'purchases', resourceId: id });
  revalidatePath(`/orders/${id}`);
  return { ok: true };
}

// --- coupons -----------------------------------------------------
export async function createCoupon(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('orders', 'add');
  const supabase = createClient();
  const code = s(fd, 'code').toUpperCase();
  if (!code) return { ok: false, error: 'Code is required.' };
  const { error } = await supabase.from('coupons').insert({
    code,
    description: s(fd, 'description'),
    discount_type: s(fd, 'discount_type') || 'percent',
    discount_value: nz(fd, 'discount_value'),
    max_discount: n(fd, 'max_discount'),
    min_order: nz(fd, 'min_order'),
    usage_limit: n(fd, 'usage_limit'),
    valid_from: s(fd, 'valid_from') || null,
    valid_till: s(fd, 'valid_till') || null,
    status: s(fd, 'status') || 'active',
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'coupon.create', module: 'orders', resourceType: 'coupons', resourceId: code });
  revalidatePath('/orders/coupons');
  redirect('/orders/coupons?created=1');
}

export async function updateCoupon(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('orders', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('coupons')
    .update({
      code: s(fd, 'code').toUpperCase(),
      description: s(fd, 'description'),
      discount_type: s(fd, 'discount_type') || 'percent',
      discount_value: nz(fd, 'discount_value'),
      max_discount: n(fd, 'max_discount'),
      min_order: nz(fd, 'min_order'),
      usage_limit: n(fd, 'usage_limit'),
      valid_from: s(fd, 'valid_from') || null,
      valid_till: s(fd, 'valid_till') || null,
      status: s(fd, 'status') || 'active',
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'coupon.update', module: 'orders', resourceType: 'coupons', resourceId: id });
  revalidatePath('/orders/coupons');
  redirect('/orders/coupons?saved=1');
}

export async function deleteCoupon(id: string): Promise<Result> {
  await requirePermission('orders', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'coupon.delete', module: 'orders', resourceType: 'coupons', resourceId: id });
  revalidatePath('/orders/coupons');
  return { ok: true };
}

export async function toggleCouponStatus(id: string, next: boolean): Promise<Result> {
  await requirePermission('orders', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('coupons').update({ status: next ? 'active' : 'inactive' }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/orders/coupons');
  return { ok: true };
}

// --- offers ----------------------------------------------------
export async function createOffer(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('orders', 'add');
  const supabase = createClient();
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };
  const { error } = await supabase.from('offers').insert({
    title,
    description: s(fd, 'description'),
    discount_label: s(fd, 'discount_label'),
    coupon_code: s(fd, 'coupon_code') || null,
    priority: nz(fd, 'priority'),
    valid_from: s(fd, 'valid_from') || null,
    valid_till: s(fd, 'valid_till') || null,
    status: s(fd, 'status') || 'active',
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/orders/offers');
  return { ok: true };
}
export async function updateOffer(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('orders', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('offers')
    .update({
      title: s(fd, 'title'),
      description: s(fd, 'description'),
      discount_label: s(fd, 'discount_label'),
      coupon_code: s(fd, 'coupon_code') || null,
      priority: nz(fd, 'priority'),
      valid_from: s(fd, 'valid_from') || null,
      valid_till: s(fd, 'valid_till') || null,
      status: s(fd, 'status') || 'active',
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/orders/offers');
  return { ok: true };
}
export async function deleteOffer(id: string): Promise<Result> {
  await requirePermission('orders', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/orders/offers');
  return { ok: true };
}

// --- refund / withdrawal decisions (transactional RPCs) ---------
export async function decideRefund(id: string, decision: 'approve' | 'reject', note: string): Promise<Result> {
  await requirePermission('orders', 'edit');
  const supabase = createClient();
  const { error } = await supabase.rpc('admin_process_refund', {
    p_request_id: id,
    p_decision: decision,
    p_note: note || '',
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: `refund.${decision}`, module: 'orders', resourceType: 'refund_requests', resourceId: id });
  revalidatePath('/orders/refunds');
  return { ok: true };
}

export async function decideWithdrawal(id: string, decision: 'approve' | 'reject' | 'paid', note: string): Promise<Result> {
  await requirePermission('orders', 'edit');
  const supabase = createClient();
  const { error } = await supabase.rpc('admin_process_withdrawal', {
    p_request_id: id,
    p_decision: decision,
    p_note: note || '',
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: `withdrawal.${decision}`, module: 'referrals', resourceType: 'withdrawal_requests', resourceId: id });
  revalidatePath('/orders/wallet-requests');
  revalidatePath('/referrals/wallet-requests');
  revalidatePath('/referrals/wallet');
  return { ok: true };
}

/**
 * Approved withdrawal: "approve" = mark paid (note = payout reference / UTR), "reject" = refund the hold.
 * TODO(payout-provider): no payout provider is configured — the admin sends the UPI transfer manually and
 * records it here. See admin_process_withdrawal (migration 0144/115) for the integration point.
 */
export async function settleWithdrawal(id: string, decision: 'approve' | 'reject', note: string): Promise<Result> {
  return decideWithdrawal(id, decision === 'approve' ? 'paid' : 'reject', note);
}
