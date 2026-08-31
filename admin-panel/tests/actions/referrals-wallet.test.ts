import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath, requirePermission, logActivity } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));

import { supabase, resetSupabaseMock, setRpcResult, setUser, rpcCall } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { adjustPlatformWallet, saveRewardSettings } from '@/app/(panel)/referrals/actions';

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue({ id: 'a-1' });
  logActivity.mockReset().mockResolvedValue(undefined);
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('adjustPlatformWallet', () => {
  it('rejects when no student is selected', async () => {
    const res = await adjustPlatformWallet({ ok: false }, form({ mode: 'credit', amount: '100' }));
    expect(res).toEqual({ ok: false, error: 'Pick a student.' });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('rejects an invalid mode', async () => {
    const res = await adjustPlatformWallet({ ok: false }, form({ user_id: 'u-1', mode: 'sideways', amount: '100' }));
    expect(res).toEqual({ ok: false, error: 'Choose add or deduct.' });
  });

  it('rejects a non-positive amount', async () => {
    const res = await adjustPlatformWallet({ ok: false }, form({ user_id: 'u-1', mode: 'credit', amount: '0' }));
    expect(res).toEqual({ ok: false, error: 'Enter a positive amount.' });
  });

  it('credits via the atomic admin_adjust_wallet RPC and maps the category', async () => {
    setRpcResult('admin_adjust_wallet', { error: null });

    const res = await adjustPlatformWallet(
      { ok: false },
      form({ user_id: 'u-1', mode: 'credit', amount: '250', description: 'goodwill' }),
    );

    expect(requirePermission).toHaveBeenCalledWith('referrals', 'edit');
    expect(rpcCall('admin_adjust_wallet')?.args[0]).toEqual({
      p_user_id: 'u-1',
      p_type: 'credit',
      p_category: 'added_money',
      p_amount: 250,
      p_description: 'goodwill',
    });
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'referral.wallet_adjust', details: { mode: 'credit', amount: 250 } }),
    );
  });

  it('maps a debit to the withdrawal category and uses a default description', async () => {
    setRpcResult('admin_adjust_wallet', { error: null });

    await adjustPlatformWallet({ ok: false }, form({ user_id: 'u-2', mode: 'debit', amount: '99' }));

    expect(rpcCall('admin_adjust_wallet')?.args[0]).toMatchObject({
      p_type: 'debit',
      p_category: 'withdrawal',
      p_description: 'Admin wallet adjustment',
    });
  });

  it('surfaces the RPC error and does not log an activity', async () => {
    setRpcResult('admin_adjust_wallet', { error: { message: 'wallet row locked' } });

    const res = await adjustPlatformWallet({ ok: false }, form({ user_id: 'u-1', mode: 'credit', amount: '10' }));

    expect(res).toEqual({ ok: false, error: 'wallet row locked' });
    expect(logActivity).not.toHaveBeenCalled();
  });
});

describe('saveRewardSettings', () => {
  it('updates the single reward_settings row (id=1) with the current admin as updated_by', async () => {
    setUser({ id: 'admin-7' });

    const res = await saveRewardSettings(
      { ok: false },
      form({ bonus_type: 'percent', bonus_value: '10', min_payout: '100', max_payout: '500', bonus_validity_days: '30', reward_on_first_purchase: 'on' }),
    );

    expect(requirePermission).toHaveBeenCalledWith('referrals', 'edit');
    const update = supabase.calls.find((c) => c.table === 'reward_settings' && c.verb === 'update');
    expect(update?.args[0]).toMatchObject({
      bonus_type: 'percent',
      bonus_value: 10,
      max_payout: 500,
      reward_on_signup: false,
      reward_on_first_purchase: true,
      updated_by: 'admin-7',
    });
    const eq = supabase.calls.find((c) => c.table === 'reward_settings' && c.verb === 'eq');
    expect(eq?.args).toEqual(['id', 1]);
    expect(res).toEqual({ ok: true });
  });
});
