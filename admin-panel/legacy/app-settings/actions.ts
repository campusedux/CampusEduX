'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

async function requireAdmin() {
  const staff = await requireStaffUser();
  if (staff.roleId !== 'admin' && staff.roleId !== 'super_admin') {
    throw new Error('Only Admins can change platform settings.');
  }
  return staff;
}

export async function updateRewardSettings(values: {
  isEnabled: boolean;
  rewardType: 'fixed' | 'percentage';
  rewardAmount: number;
  minPurchase: number;
  perUserCap: number | null;
  validityDays: number;
}) {
  const staff = await requireAdmin();
  const supabase = createClient();

  const { data: before } = await supabase.from('reward_settings').select('*').eq('id', 1).single();
  const { error } = await supabase
    .from('reward_settings')
    .update({
      is_enabled: values.isEnabled,
      reward_type: values.rewardType,
      reward_amount: values.rewardAmount,
      min_purchase: values.minPurchase,
      per_user_cap: values.perUserCap,
      validity_days: values.validityDays,
    })
    .eq('id', 1);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'settings.reward_settings_update',
    resourceType: 'reward_settings',
    resourceId: '1',
    oldValue: before,
    newValue: values,
  });

  revalidatePath('/settings');
}

export async function toggleFeatureFlag(key: string, isEnabled: boolean) {
  const staff = await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('feature_flags').update({ is_enabled: isEnabled }).eq('key', key);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'settings.feature_flag_toggle',
    resourceType: 'feature_flags',
    resourceId: key,
    newValue: { is_enabled: isEnabled },
  });

  revalidatePath('/settings');
}

export async function updateFeatureFlagRollout(key: string, rolloutPercentage: number) {
  const staff = await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from('feature_flags')
    .update({ rollout_percentage: rolloutPercentage })
    .eq('key', key);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'settings.feature_flag_rollout',
    resourceType: 'feature_flags',
    resourceId: key,
    newValue: { rollout_percentage: rolloutPercentage },
  });

  revalidatePath('/settings');
}

export async function toggleHomeSection(sectionKey: string, isEnabled: boolean) {
  const staff = await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('home_layout').update({ is_enabled: isEnabled }).eq('section_key', sectionKey);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'settings.home_section_toggle',
    resourceType: 'home_layout',
    resourceId: sectionKey,
    newValue: { is_enabled: isEnabled },
  });

  revalidatePath('/settings');
}

export async function reorderHomeSection(sectionKey: string, sortOrder: number) {
  const staff = await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('home_layout').update({ sort_order: sortOrder }).eq('section_key', sectionKey);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'settings.home_section_reorder',
    resourceType: 'home_layout',
    resourceId: sectionKey,
    newValue: { sort_order: sortOrder },
  });

  revalidatePath('/settings');
}
