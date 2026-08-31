'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffUser, requirePermission } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function approveRefund(refundId: string) {
  const staff = await requireStaffUser();
  await requirePermission('refunds', 'update');

  const supabase = createClient();
  const { data: refund, error: fetchError } = await supabase
    .from('refunds')
    .select('id, order_id, amount, status')
    .eq('id', refundId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (refund.status !== 'requested') throw new Error('This refund has already been decided.');

  // reverse_purchase_on_refund is service-role-only (see migration 016) — it's
  // the same atomic function the webhook path relies on, so a refund credits
  // the wallet, flips the order to refunded, and claws back any tied referral
  // reward all in one transaction, never as separate admin-panel steps.
  const admin = createAdminClient();
  const { error: rpcError } = await admin.rpc('reverse_purchase_on_refund', {
    p_order_id: refund.order_id,
    p_refund_amount: refund.amount,
  });
  if (rpcError) throw new Error(rpcError.message);

  const { error: updateError } = await admin
    .from('refunds')
    .update({ status: 'processed', approved_by: staff.id })
    .eq('id', refundId);
  if (updateError) throw new Error(updateError.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'refund.approve',
    resourceType: 'refunds',
    resourceId: refundId,
    oldValue: { status: 'requested' },
    newValue: { status: 'processed' },
  });

  revalidatePath('/orders');
  revalidatePath(`/orders/${refund.order_id}`);
}

export async function rejectRefund(refundId: string, reason: string) {
  const staff = await requireStaffUser();
  await requirePermission('refunds', 'update');

  const supabase = createClient();
  const { data: refund, error } = await supabase
    .from('refunds')
    .update({ status: 'rejected', approved_by: staff.id, reason })
    .eq('id', refundId)
    .eq('status', 'requested')
    .select('order_id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'refund.reject',
    resourceType: 'refunds',
    resourceId: refundId,
    newValue: { status: 'rejected', reason },
  });

  revalidatePath('/orders');
  revalidatePath(`/orders/${refund.order_id}`);
}
