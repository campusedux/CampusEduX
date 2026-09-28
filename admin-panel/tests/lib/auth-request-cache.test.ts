import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * In the Next server runtime `react`'s `cache()` memoises per request. The
 * plain `react` build used here doesn't ship it, so stand in a simple
 * memoiser (one "request" per test, reset in beforeEach) to prove the auth
 * gate's lookups are wired through it: layout + page + action checks in one
 * request must share a single getUser / admin_users / role_permissions read.
 */
const { memos } = vi.hoisted(() => ({ memos: [] as Map<string, unknown>[] }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => {
      const memo = new Map<string, unknown>();
      memos.push(memo);
      return ((...args: never[]) => {
        const key = JSON.stringify(args);
        if (!memo.has(key)) memo.set(key, fn(...args));
        return memo.get(key);
      }) as unknown as T;
    },
  };
});

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: 'NEXT_REDIRECT', url };
  }),
}));
vi.mock('next/navigation', () => ({ redirect }));

import { supabase, resetSupabaseMock, setUser, setTableResult, setRpcResult, callsFor } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { requireAdmin, requireModule, requirePermission } from '@/lib/auth';

beforeEach(() => {
  resetSupabaseMock();
  for (const m of memos) m.clear(); // a fresh "request"
});

const adminRow = { id: 'a-1', email: 'a@x.app', full_name: 'A', role: 'editor', status: 'active', avatar_url: null };

describe('auth gate is request-scoped', () => {
  it('layout + page + action checks share one session / admin / permissions lookup', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: adminRow });
    setTableResult('role_permissions', { data: [] });
    setRpcResult('has_permission', { data: true });

    await requireAdmin(); // layout
    await requireModule('learning'); // page
    await requirePermission('learning', 'edit'); // action
    await requirePermission('learning', 'edit');

    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(callsFor('admin_users').filter((c) => c.verb === 'select')).toHaveLength(1);
    expect(callsFor('role_permissions').filter((c) => c.verb === 'select')).toHaveLength(1);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
  });

  it('still enforces per call: a denied module / permission is refused even with a cached admin', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: adminRow });
    setTableResult('role_permissions', { data: [] });
    setRpcResult('has_permission', { data: false });

    await requireAdmin();
    await expect(requireModule('settings')).rejects.toMatchObject({ url: '/?error=no_access' });
    await expect(requirePermission('learning', 'delete')).rejects.toThrow(/permission to delete in learning/);
  });

  it('a cached "no session" result keeps redirecting to /login', async () => {
    setUser(null);
    await expect(requireAdmin()).rejects.toMatchObject({ url: '/login' });
    await expect(requireModule('learning')).rejects.toMatchObject({ url: '/login' });
  });
});
