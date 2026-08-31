'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);

export async function saveRewardSettings(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('referrals', 'edit');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('reward_settings')
    .update({
      bonus_type: s(fd, 'bonus_type') || 'flat',
      bonus_value: n(fd, 'bonus_value'),
      min_payout: n(fd, 'min_payout'),
      max_payout: n(fd, 'max_payout'),
      bonus_validity_days: n(fd, 'bonus_validity_days'),
      reward_on_signup: fd.get('reward_on_signup') === 'on',
      reward_on_first_purchase: fd.get('reward_on_first_purchase') === 'on',
      reward_on_subscription: fd.get('reward_on_subscription') === 'on',
      updated_by: user?.id ?? null,
    })
    .eq('id', 1);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'referral.reward_settings.update', module: 'referrals', resourceType: 'reward_settings' });
  revalidatePath('/referrals/reward-settings');
  return { ok: true };
}

export async function searchStudents(q: string): Promise<{ id: string; full_name: string; email: string }[]> {
  await requirePermission('referrals', 'view');
  const supabase = createClient();
  const term = q.trim();
  if (!term) return [];
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(15);
  return data ?? [];
}

/** Platform wallet Add/Deduct/Adjust — targets one student, via the atomic RPC. */
export async function adjustPlatformWallet(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('referrals', 'edit');
  const supabase = createClient();
  const userId = s(fd, 'user_id');
  const mode = s(fd, 'mode');
  const amount = n(fd, 'amount');
  const description = s(fd, 'description') || 'Admin wallet adjustment';

  if (!userId) return { ok: false, error: 'Pick a student.' };
  if (!['credit', 'debit'].includes(mode)) return { ok: false, error: 'Choose add or deduct.' };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Enter a positive amount.' };

  const { error } = await supabase.rpc('admin_adjust_wallet', {
    p_user_id: userId,
    p_type: mode,
    p_category: mode === 'credit' ? 'added_money' : 'withdrawal',
    p_amount: amount,
    p_description: description,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'referral.wallet_adjust', module: 'referrals', resourceType: 'profiles', resourceId: userId, details: { mode, amount } });
  revalidatePath('/referrals/wallet');
  return { ok: true };
}
