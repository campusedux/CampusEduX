import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath, requirePermission, logActivity, redirect, setAuthBan } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
  redirect: vi.fn(),
  setAuthBan: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));
vi.mock('@/lib/supabase/adminApi', () => ({ setAuthBan }));

import { supabase, resetSupabaseMock, setUser, callsFor } from '../helpers/supabase.mock';
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
  setAuthBan.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  setUser({ id: 'admin-1' });
});

describe('setStudentStatus (DB-04)', () => {
  it('blocks in DB then bans in Auth', async () => {
    setAuthBan.mockResolvedValue({ status: 'applied' });
    await setStudentStatus('s1', { ok: false }, form({ action: 'block', reason: 'abuse' }));
    expect(callsFor('profiles').find((c) => c.verb === 'update')?.args[0]).toMatchObject({ status: 'blocked' });
    expect(setAuthBan).toHaveBeenCalledWith('s1', true);
    expect(redirect).toHaveBeenCalledWith('/students/s1?status=1');
  });
  it('unblock lifts the Auth ban', async () => {
    setAuthBan.mockResolvedValue({ status: 'applied' });
    await setStudentStatus('s1', { ok: false }, form({ action: 'unblock' }));
    expect(setAuthBan).toHaveBeenCalledWith('s1', false);
  });
  it('without the service key still succeeds and surfaces a warning', async () => {
    setAuthBan.mockResolvedValue({ status: 'skipped', warning: 'w' });
    await setStudentStatus('s1', { ok: false }, form({ action: 'block', reason: 'abuse' }));
    expect(redirect).toHaveBeenCalledWith('/students/s1?status=1&warn=auth_ban_skipped');
    expect(console.warn).toHaveBeenCalled();
  });
  it('reports a failed Auth ban (DB block already applied)', async () => {
    setAuthBan.mockResolvedValue({ status: 'failed', error: 'boom' });
    const r = await setStudentStatus('s1', { ok: false }, form({ action: 'block', reason: 'abuse' }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/blocked in the database.*boom/);
    expect(redirect).not.toHaveBeenCalled();
  });
});
