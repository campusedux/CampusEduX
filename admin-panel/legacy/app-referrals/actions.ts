'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

function assertIsAdmin(roleId: string) {
  if (roleId !== 'admin' && roleId !== 'super_admin') {
    throw new Error('Only Admin and Super Admin accounts can adjust wallet balances.');
  }
}

export interface WalletAdjustmentValues {
  userEmail: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string;
}

// Ledger is append-only (see supabase/migrations/006_referral_wallet.sql —
// wallet_transactions forbids update/delete by trigger), so a correction is
// always a new offsetting row, never an edit to an old one. This inserts
// with source = 'admin_credit', the only source a client-authenticated admin
// session is allowed to write under RLS policy "wallet_transactions_admin_insert".
export async function adjustWallet(values: WalletAdjustmentValues) {
  const staff = await requireStaffUser();
  assertIsAdmin(staff.roleId);

  if (!(values.amount > 0)) throw new Error('Amount must be greater than zero.');

  const supabase = createClient();

  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .eq('email', values.userEmail.trim())
    .maybeSingle();
  if (userError) throw new Error(userError.message);
  if (!user) throw new Error(`No user found with email ${values.userEmail}`);

  const { error } = await supabase.from('wallet_transactions').insert({
    user_id: user.id,
    amount: values.amount,
    direction: values.direction,
    source: 'admin_credit',
    description: values.description || null,
    created_by: staff.id,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'wallet.admin_adjustment',
    resourceType: 'wallet_transactions',
    resourceId: user.id,
    newValue: values,
  });

  revalidatePath('/referrals');
}
