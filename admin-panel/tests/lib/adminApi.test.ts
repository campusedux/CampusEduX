import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setAuthBan, BAN_DURATION, SKIP_WARNING } from '@/lib/supabase/adminApi';

const updateUserById = vi.fn();
const factory = vi.fn(() => ({ auth: { admin: { updateUserById } } }) as never);

beforeEach(() => {
  updateUserById.mockReset().mockResolvedValue({ error: null });
  factory.mockClear();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
});
afterEach(() => vi.unstubAllEnvs());

describe('setAuthBan', () => {
  it('skips with a warning when SUPABASE_SERVICE_ROLE_KEY is unset', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect(await setAuthBan('u1', true, factory)).toEqual({ status: 'skipped', warning: SKIP_WARNING });
    expect(factory).not.toHaveBeenCalled();
  });
  it('bans with a long ban_duration, unbans with "none"', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc');
    expect(await setAuthBan('u1', true, factory)).toEqual({ status: 'applied' });
    expect(updateUserById).toHaveBeenLastCalledWith('u1', { ban_duration: BAN_DURATION });
    await setAuthBan('u1', false, factory);
    expect(updateUserById).toHaveBeenLastCalledWith('u1', { ban_duration: 'none' });
  });
  it('reports failure instead of throwing', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'svc');
    updateUserById.mockResolvedValue({ error: { message: 'nope' } });
    expect(await setAuthBan('u1', true, factory)).toEqual({ status: 'failed', error: 'nope' });
    updateUserById.mockRejectedValue(new Error('net'));
    expect(await setAuthBan('u1', true, factory)).toEqual({ status: 'failed', error: 'net' });
  });
});
