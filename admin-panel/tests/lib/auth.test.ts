import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Emulate Next's redirect(): it throws to halt the render/action. We throw a
 * tagged plain object so tests can assert the target url via `.rejects`.
 */
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: 'NEXT_REDIRECT', url };
  }),
}));
vi.mock('next/navigation', () => ({ redirect }));

import { supabase, resetSupabaseMock, setUser, setTableResult, setRpcResult } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { requireAdmin, loadPermissions, requireModule, hasPermission, requirePermission } from '@/lib/auth';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions';

beforeEach(() => resetSupabaseMock());

const activeAdminRow = {
  id: 'a-1',
  email: 'admin@campusedux.app',
  full_name: 'Ada Admin',
  role: 'admin',
  status: 'active',
  avatar_url: null,
};

describe('requireAdmin', () => {
  it('redirects to /login when there is no session', async () => {
    setUser(null);
    await expect(requireAdmin()).rejects.toMatchObject({ url: '/login' });
  });

  it('redirects to /login?error=not_admin when the user has no admin_users row', async () => {
    setUser({ id: 'u-1' });
    setTableResult('admin_users', { data: null });
    await expect(requireAdmin()).rejects.toMatchObject({ url: '/login?error=not_admin' });
  });

  it('redirects when the admin row is suspended', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: { ...activeAdminRow, status: 'suspended' } });
    await expect(requireAdmin()).rejects.toMatchObject({ url: '/login?error=not_admin' });
  });

  it('returns the mapped admin (with its permission matrix) for an active row', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: activeAdminRow });
    setTableResult('role_permissions', { data: [] }); // loadPermissions falls back to defaults

    const admin = await requireAdmin();

    expect(admin).toMatchObject({ id: 'a-1', email: 'admin@campusedux.app', fullName: 'Ada Admin', role: 'admin' });
    expect(admin.perms.orders.delete).toBe(true);
    expect(admin.perms.admin_users.view).toBe(false);
  });
});

describe('loadPermissions', () => {
  it('returns the static matrix for super_admin without touching the DB', async () => {
    const perms = await loadPermissions('super_admin');
    expect(perms).toEqual(DEFAULT_PERMISSIONS.super_admin);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('overlays role_permissions rows onto the role defaults', async () => {
    setTableResult('role_permissions', {
      data: [{ module: 'orders', can_view: true, can_add: true, can_edit: true, can_delete: true }],
    });

    const perms = await loadPermissions('support');

    expect(perms.orders).toEqual({ view: true, add: true, edit: true, delete: true }); // from DB
    expect(perms.students).toEqual(DEFAULT_PERMISSIONS.support.students); // untouched default
  });

  it('falls back to defaults on a query error', async () => {
    setTableResult('role_permissions', { error: { message: 'no table' } });
    const perms = await loadPermissions('viewer');
    expect(perms).toEqual(DEFAULT_PERMISSIONS.viewer);
  });
});

describe('requireModule', () => {
  it('bounces to /?error=no_access when the role cannot view the module', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: { ...activeAdminRow, role: 'support' } });
    setTableResult('role_permissions', { data: [] });

    await expect(requireModule('reports')).rejects.toMatchObject({ url: '/?error=no_access' });
  });

  it('returns the admin when the role can view the module', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: { ...activeAdminRow, role: 'support' } });
    setTableResult('role_permissions', { data: [] });

    const admin = await requireModule('orders');
    expect(admin.role).toBe('support');
  });
});

describe('hasPermission', () => {
  it('returns false when there is no session', async () => {
    setUser(null);
    expect(await hasPermission('orders', 'edit')).toBe(false);
  });

  it('trusts the DB has_permission() RPC when it is deployed', async () => {
    setUser({ id: 'a-1' });
    setRpcResult('has_permission', { data: true });
    expect(await hasPermission('orders', 'edit')).toBe(true);
  });

  it('falls back to the static role matrix when the RPC is missing', async () => {
    setUser({ id: 'a-1' });
    setRpcResult('has_permission', { error: { code: 'PGRST202', message: 'not found' } });
    setTableResult('admin_users', { data: { role: 'viewer' } });

    expect(await hasPermission('orders', 'edit')).toBe(false); // viewer is read-only
    expect(await hasPermission('orders', 'view')).toBe(true);
  });
});

describe('requirePermission', () => {
  it('throws a descriptive error when the caller lacks the permission', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: activeAdminRow });
    setTableResult('role_permissions', { data: [] });
    setRpcResult('has_permission', { data: false });

    await expect(requirePermission('orders', 'delete')).rejects.toThrow(
      "You don't have permission to delete in orders.",
    );
  });

  it('returns the admin when the permission check passes', async () => {
    setUser({ id: 'a-1' });
    setTableResult('admin_users', { data: activeAdminRow });
    setTableResult('role_permissions', { data: [] });
    setRpcResult('has_permission', { data: true });

    const admin = await requirePermission('orders', 'edit');
    expect(admin.id).toBe('a-1');
  });
});
