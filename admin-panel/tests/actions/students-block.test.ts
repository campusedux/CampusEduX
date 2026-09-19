import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath, requirePermission, logActivity, redirect, invoke } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
  redirect: vi.fn(),
  invoke: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));

import { supabase, resetSupabaseMock, setUser, callsFor } from '../helpers/supabase.mock';
Object.assign(supabase, { functions: { invoke } });
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { setStudentStatus } from '@/app/(panel)/students/actions';

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue({ id: 'a' });
  logActivity.mockReset();
  redirect.mockReset();
  invoke.mockReset().mockResolvedValue({ data: { ok: true }, error: null });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setUser({ id: 'admin-1' });
});

describe('setStudentStatus (DB-04)', () => {
  it('blocks in DB first, then invokes admin-ban-user with banned:true', async () => {
    await setStudentStatus('s1', { ok: false }, form({ action: 'block', reason: 'abuse' }));
    expect(callsFor('profiles').find((c) => c.verb === 'update')?.args[0]).toMatchObject({ status: 'blocked' });
    expect(invoke).toHaveBeenCalledWith('admin-ban-user', { body: { userId: 's1', banned: true } });
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ details: { reason: 'abuse', auth_ban: 'applied' } }));
    expect(redirect).toHaveBeenCalledWith('/students/s1?status=1');
  });
  it('unblock invokes the function with banned:false', async () => {
    await setStudentStatus('s1', { ok: false }, form({ action: 'unblock' }));
    expect(invoke).toHaveBeenCalledWith('admin-ban-user', { body: { userId: 's1', banned: false } });
    expect(redirect).toHaveBeenCalledWith('/students/s1?status=1');
  });
  it('requires a reason to block and does not invoke', async () => {
    const r = await setStudentStatus('s1', { ok: false }, form({ action: 'block' }));
    expect(r.ok).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });
  it('function error: DB block stays applied, error returned, failure logged', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const r = await setStudentStatus('s1', { ok: false }, form({ action: 'block', reason: 'abuse' }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/DB-level block IS applied.*Auth-level ban failed/);
    expect(r.error).not.toMatch(/boom/);
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ details: { reason: 'abuse', auth_ban: 'failed' } }));
    expect(redirect).not.toHaveBeenCalled();
  });
  it('thrown invoke or ok:false body is treated as failure', async () => {
    invoke.mockRejectedValue(new Error('net'));
    expect((await setStudentStatus('s1', { ok: false }, form({ action: 'unblock' }))).ok).toBe(false);
    invoke.mockReset().mockResolvedValue({ data: { ok: false, error: 'x' }, error: null });
    expect((await setStudentStatus('s1', { ok: false }, form({ action: 'unblock' }))).ok).toBe(false);
  });
});
