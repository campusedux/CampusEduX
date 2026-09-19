/**
 * @jest-environment node
 */
// Node/jest twin of supabase/functions/admin-ban-user/handler.test.ts (Deno): executes the SAME pure handler.
import { handleAdminBan, type AdminBanDeps } from '../../../supabase/functions/admin-ban-user/handler';

const CALLER = '11111111-1111-4111-8111-111111111111';
const TARGET = '22222222-2222-4222-8222-222222222222';

function deps(over: Partial<AdminBanDeps> = {}) {
  const calls: [string, string][] = [];
  const d: AdminBanDeps = {
    getCaller: async () => ({ id: CALLER }),
    isAdmin: async () => true,
    hasPermission: async () => true,
    getActiveAdminRole: async (id) => (id === CALLER ? 'admin' : null),
    setBan: async (u, dur) => {
      calls.push([u, dur]);
      return { error: null };
    },
    ...over,
  };
  return { d, calls };
}
const req = (body: unknown) =>
  new Request('http://x/admin-ban-user', {
    method: 'POST',
    headers: { Authorization: 'Bearer t', 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('admin-ban-user handler', () => {
  it('no/invalid JWT -> 401', async () => {
    const { d, calls } = deps({ getCaller: async () => null });
    expect((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it('non-admin -> 403', async () => {
    const { d, calls } = deps({ isAdmin: async () => false });
    expect((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
  it('admin without students:edit -> 403', async () => {
    const hasPermission = jest.fn(async () => false);
    const { d, calls } = deps({ hasPermission });
    expect((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status).toBe(403);
    expect(hasPermission).toHaveBeenCalledWith(CALLER, 'students', 'edit');
    expect(calls).toHaveLength(0);
  });
  it('bad body -> 400', async () => {
    const { d } = deps();
    for (const b of ['not json', {}, { userId: 'nope', banned: true }, { userId: TARGET, banned: 'yes' }]) {
      expect((await handleAdminBan(req(b), d)).status).toBe(400);
    }
  });
  it('self-ban -> 400', async () => {
    const { d, calls } = deps();
    expect((await handleAdminBan(req({ userId: CALLER, banned: true }), d)).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it('non-super admin cannot ban a super_admin; super_admin can', async () => {
    const roles: Record<string, string> = { [TARGET]: 'super_admin', [CALLER]: 'admin' };
    const { d } = deps({ getActiveAdminRole: async (id) => roles[id] ?? null });
    expect((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status).toBe(403);
    roles[CALLER] = 'super_admin';
    expect((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status).toBe(200);
  });
  it('ban and unban call setBan with the right arguments', async () => {
    const { d, calls } = deps();
    const r = await handleAdminBan(req({ userId: TARGET, banned: true }), d);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    await handleAdminBan(req({ userId: TARGET, banned: false }), d);
    expect(calls).toEqual([[TARGET, '87600h'], [TARGET, 'none']]);
  });
  it('service error -> generic 500', async () => {
    const { d } = deps({ setBan: async () => ({ error: new Error('secret internals') }) });
    const r = await handleAdminBan(req({ userId: TARGET, banned: true }), d);
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain('secret');
  });
  it('thrown dependency -> generic 500', async () => {
    const { d } = deps({ getActiveAdminRole: async () => { throw new Error('db'); } });
    expect((await handleAdminBan(req({ userId: TARGET, banned: true }), d)).status).toBe(500);
  });
  it('OPTIONS preflight -> 200', async () => {
    const { d } = deps();
    expect((await handleAdminBan(new Request('http://x', { method: 'OPTIONS' }), d)).status).toBe(200);
  });
});
