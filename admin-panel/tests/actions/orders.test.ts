import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirect, revalidatePath, requirePermission, logActivity } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: 'NEXT_REDIRECT', url };
  }),
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));

import { supabase, resetSupabaseMock, setRpcResult, setTableResult, callsFor, rpcCall } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import {
  decideRefund,
  decideWithdrawal,
  createCoupon,
  deleteCoupon,
  saveOrderNotes,
} from '@/app/(panel)/orders/actions';

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue({ id: 'a-1' });
  logActivity.mockReset().mockResolvedValue(undefined);
  redirect.mockClear();
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('decideRefund', () => {
  it('routes the decision through the transactional admin_process_refund RPC', async () => {
    setRpcResult('admin_process_refund', { error: null });

    const res = await decideRefund('req-1', 'approve', 'files were broken');

    expect(requirePermission).toHaveBeenCalledWith('orders', 'edit');
    expect(rpcCall('admin_process_refund')?.args[0]).toEqual({
      p_request_id: 'req-1',
      p_decision: 'approve',
      p_note: 'files were broken',
    });
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'refund.approve', module: 'orders' }));
  });

  it('surfaces the RPC error without logging an activity', async () => {
    setRpcResult('admin_process_refund', { error: { message: 'request already processed' } });

    const res = await decideRefund('req-1', 'reject', '');

    expect(res).toEqual({ ok: false, error: 'request already processed' });
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('is blocked when the caller lacks orders:edit', async () => {
    requirePermission.mockRejectedValueOnce(new Error("You don't have permission to edit in orders."));

    await expect(decideRefund('req-1', 'approve', '')).rejects.toThrow(/permission to edit in orders/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('decideWithdrawal', () => {
  it('routes through admin_process_withdrawal and revalidates every wallet-queue path', async () => {
    setRpcResult('admin_process_withdrawal', { error: null });

    const res = await decideWithdrawal('wd-9', 'approve', 'verified UPI');

    expect(rpcCall('admin_process_withdrawal')?.args[0]).toEqual({
      p_request_id: 'wd-9',
      p_decision: 'approve',
      p_note: 'verified UPI',
    });
    expect(res).toEqual({ ok: true });
    const paths = revalidatePath.mock.calls.flat();
    expect(paths).toEqual(
      expect.arrayContaining(['/orders/wallet-requests', '/referrals/wallet-requests', '/referrals/wallet']),
    );
  });

  it('returns the RPC error on a rejected balance check', async () => {
    setRpcResult('admin_process_withdrawal', { error: { message: 'insufficient platform balance' } });
    expect(await decideWithdrawal('wd-9', 'approve', '')).toEqual({
      ok: false,
      error: 'insufficient platform balance',
    });
  });
});

describe('createCoupon', () => {
  it('rejects a blank code before writing', async () => {
    const res = await createCoupon({ ok: false }, form({ code: '   ' }));
    expect(res).toEqual({ ok: false, error: 'Code is required.' });
    expect(callsFor('coupons')).toHaveLength(0);
  });

  it('inserts an upper-cased coupon then redirects to the list', async () => {
    setTableResult('coupons', { error: null });

    await expect(
      createCoupon({ ok: false }, form({ code: 'diwali25', discount_type: 'percent', discount_value: '25' })),
    ).rejects.toMatchObject({ url: '/orders/coupons?created=1' });

    const insert = callsFor('coupons').find((c) => c.verb === 'insert');
    expect((insert?.args[0] as Record<string, unknown>).code).toBe('DIWALI25');
    expect((insert?.args[0] as Record<string, unknown>).discount_value).toBe(25);
  });

  it('returns the DB error (and does not redirect) when the insert fails', async () => {
    setTableResult('coupons', { error: { message: 'duplicate key value violates unique constraint' } });

    const res = await createCoupon({ ok: false }, form({ code: 'DUP' }));
    expect(res).toEqual({ ok: false, error: 'duplicate key value violates unique constraint' });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('deleteCoupon', () => {
  it('requires orders:delete and reports success', async () => {
    setTableResult('coupons', { error: null });
    const res = await deleteCoupon('c-1');
    expect(requirePermission).toHaveBeenCalledWith('orders', 'delete');
    expect(res).toEqual({ ok: true });
  });
});

describe('saveOrderNotes', () => {
  it('writes null when the note is cleared', async () => {
    setTableResult('purchases', { error: null });

    const res = await saveOrderNotes('o-1', { ok: false }, form({ admin_notes: '' }));

    const update = callsFor('purchases').find((c) => c.verb === 'update');
    expect((update?.args[0] as Record<string, unknown>).admin_notes).toBeNull();
    expect(res).toEqual({ ok: true });
  });
});
