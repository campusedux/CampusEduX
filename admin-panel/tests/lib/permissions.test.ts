import { describe, it, expect } from 'vitest';
import {
  MODULES,
  ADMIN_ROLES,
  DEFAULT_PERMISSIONS,
  permsFor,
  can,
} from '@/lib/permissions';

describe('permission matrix shape', () => {
  it('defines every module for every role', () => {
    for (const role of ADMIN_ROLES) {
      for (const m of MODULES) {
        expect(DEFAULT_PERMISSIONS[role][m], `${role}.${m}`).toEqual(
          expect.objectContaining({
            view: expect.any(Boolean),
            add: expect.any(Boolean),
            edit: expect.any(Boolean),
            delete: expect.any(Boolean),
          }),
        );
      }
    }
  });
});

describe('super_admin', () => {
  it('can do everything, everywhere', () => {
    for (const m of MODULES) {
      for (const a of ['view', 'add', 'edit', 'delete'] as const) {
        expect(can('super_admin', m, a)).toBe(true);
      }
    }
  });
});

describe('admin', () => {
  it('runs the whole product but never sees the four super-admin-only areas', () => {
    expect(can('admin', 'orders', 'delete')).toBe(true);
    expect(can('admin', 'projects', 'add')).toBe(true);
    for (const m of ['admin_users', 'roles', 'backup', 'system_logs'] as const) {
      expect(can('admin', m, 'view')).toBe(false);
    }
  });
});

describe('editor', () => {
  it('can create/edit catalog + CMS but cannot delete or touch Settings', () => {
    expect(can('editor', 'projects', 'add')).toBe(true);
    expect(can('editor', 'projects', 'edit')).toBe(true);
    expect(can('editor', 'projects', 'delete')).toBe(false);
    expect(can('editor', 'cms', 'edit')).toBe(true);
    expect(can('editor', 'settings', 'view')).toBe(false);
    // no operational surfaces
    expect(can('editor', 'orders', 'edit')).toBe(false);
    expect(can('editor', 'students', 'edit')).toBe(false);
  });

  it('manages the Blog (view/add/edit) but cannot delete posts', () => {
    expect(can('editor', 'blog', 'view')).toBe(true);
    expect(can('editor', 'blog', 'add')).toBe(true);
    expect(can('editor', 'blog', 'edit')).toBe(true);
    expect(can('editor', 'blog', 'delete')).toBe(false);
  });
});

describe('blog module', () => {
  it('is a gate-able module with sensible per-role defaults', () => {
    expect(MODULES).toContain('blog');
    expect(can('super_admin', 'blog', 'delete')).toBe(true);
    expect(can('admin', 'blog', 'delete')).toBe(true);
    expect(can('support', 'blog', 'view')).toBe(true);
    expect(can('support', 'blog', 'edit')).toBe(false);
    expect(can('viewer', 'blog', 'view')).toBe(true);
    expect(can('viewer', 'blog', 'add')).toBe(false);
  });
});

describe('support', () => {
  it('works the operations desk (students/orders/referrals/reviews) with edit but no add/delete', () => {
    for (const m of ['students', 'orders', 'referrals', 'reviews'] as const) {
      expect(can('support', m, 'view')).toBe(true);
      expect(can('support', m, 'edit')).toBe(true);
      expect(can('support', m, 'add')).toBe(false);
      expect(can('support', m, 'delete')).toBe(false);
    }
    expect(can('support', 'reports', 'view')).toBe(false);
    expect(can('support', 'settings', 'view')).toBe(false);
    expect(can('support', 'projects', 'edit')).toBe(false);
  });
});

describe('viewer', () => {
  it('is read-only across the board', () => {
    for (const m of MODULES) {
      expect(can('viewer', m, 'add')).toBe(false);
      expect(can('viewer', m, 'edit')).toBe(false);
      expect(can('viewer', m, 'delete')).toBe(false);
    }
    expect(can('viewer', 'orders', 'view')).toBe(true);
    expect(can('viewer', 'admin_users', 'view')).toBe(false);
  });
});

describe('permsFor / can fallbacks', () => {
  it('permsFor returns the viewer matrix for an unknown role', () => {
    expect(permsFor('nonsense' as never)).toEqual(DEFAULT_PERMISSIONS.viewer);
  });

  it('can returns false for an unknown module', () => {
    expect(can('super_admin', 'nope' as never, 'view')).toBe(false);
  });
});
