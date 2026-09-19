import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_PERMISSIONS, MODULES, type AdminRole, type PermissionMatrix } from '@/lib/permissions';
import { MONEY_RPC_ROLES, canPerm, evaluateGate, roleAllowed } from '@/lib/permission-gate';
import { AdminPermissionsProvider } from '@/components/auth/AdminPermissionsProvider';
import { PermissionGate } from '@/components/auth/PermissionGate';

/** Build a matrix the way loadPermissions() does from role_permissions rows. */
function fromRows(
  rows: { module: string; can_view: boolean; can_add: boolean; can_edit: boolean; can_delete: boolean }[],
): PermissionMatrix {
  const out = {} as PermissionMatrix;
  for (const m of MODULES) out[m] = { view: false, add: false, edit: false, delete: false };
  for (const r of rows) {
    if (!(MODULES as readonly string[]).includes(r.module)) continue;
    out[r.module as keyof PermissionMatrix] = { view: r.can_view, add: r.can_add, edit: r.can_edit, delete: r.can_delete };
  }
  return out;
}

const supportPerms = fromRows([
  { module: 'orders', can_view: true, can_add: false, can_edit: true, can_delete: false },
  { module: 'referrals', can_view: true, can_add: false, can_edit: true, can_delete: false },
]);

describe('canPerm / evaluateGate', () => {
  it('reads the role_permissions matrix', () => {
    expect(canPerm(supportPerms, 'orders', 'edit')).toBe(true);
    expect(canPerm(supportPerms, 'orders', 'delete')).toBe(false);
    expect(canPerm(supportPerms, 'blog', 'view')).toBe(false);
  });

  it('fails closed with no matrix / role', () => {
    expect(canPerm(null, 'orders', 'view')).toBe(false);
    expect(evaluateGate(null, null, { can: { module: 'orders', action: 'view' } }).allowed).toBe(false);
    expect(roleAllowed(null, MONEY_RPC_ROLES)).toBe(false);
  });

  it('role guard blocks support even when the matrix allows it', () => {
    const r = evaluateGate(supportPerms, 'support', {
      can: { module: 'orders', action: 'edit' },
      roles: MONEY_RPC_ROLES,
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('support');
    expect(r.reason).toContain('super_admin/admin');
  });

  it('admin with the permission passes; without it fails with a module reason', () => {
    const admin = DEFAULT_PERMISSIONS.admin;
    expect(evaluateGate(admin, 'admin', { can: { module: 'orders', action: 'edit' }, roles: MONEY_RPC_ROLES }).allowed).toBe(true);
    const stripped = fromRows([]);
    const r = evaluateGate(stripped, 'admin', { can: { module: 'orders', action: 'edit' }, roles: MONEY_RPC_ROLES });
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('orders: edit');
  });

  it('multiple requirements must all hold', () => {
    const spec = { can: [{ module: 'orders', action: 'edit' }, { module: 'blog', action: 'edit' }] as const };
    expect(evaluateGate(supportPerms, 'support', { can: [...spec.can] }).allowed).toBe(false);
  });
});

describe('MONEY_RPC_ROLES mirrors migration 0119', () => {
  it('matches every require_admin_role(array[...]) in the migration', () => {
    const sql = readFileSync(
      join(__dirname, '../../../mobile-app/supabase/migrations/0119_admin_permission_enforcement.sql'),
      'utf8',
    );
    const calls = [...sql.matchAll(/perform public\.require_admin_role\(array\[([^\]]*)\]/g)];
    expect(calls.length).toBeGreaterThanOrEqual(4);
    for (const c of calls) {
      const roles = [...c[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
      expect(roles).toEqual([...MONEY_RPC_ROLES].sort());
    }
  });
});

function render(role: AdminRole, perms: PermissionMatrix, gate: Parameters<typeof PermissionGate>[0]) {
  return renderToStaticMarkup(
    h(AdminPermissionsProvider, { role, perms, children: h(PermissionGate, gate) }),
  );
}

describe('<PermissionGate>', () => {
  const child = h('button', null, 'Approve');

  it('renders children when allowed', () => {
    const html = render('admin', DEFAULT_PERMISSIONS.admin, {
      can: { module: 'orders', action: 'edit' },
      roles: MONEY_RPC_ROLES,
      mode: 'disable',
      children: child,
    });
    expect(html).toBe('<button>Approve</button>');
  });

  it('hide mode renders nothing when denied', () => {
    const html = render('support', supportPerms, {
      can: { module: 'orders', action: 'edit' },
      roles: MONEY_RPC_ROLES,
      mode: 'hide',
      children: child,
    });
    expect(html).toBe('');
  });

  it('disable mode wraps in a disabled fieldset with tooltip + aria text', () => {
    const html = render('support', supportPerms, {
      can: { module: 'orders', action: 'edit' },
      roles: MONEY_RPC_ROLES,
      mode: 'disable',
      children: child,
    });
    expect(html).toContain('<fieldset disabled');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('title="Your role (support) can&#x27;t do this — needs super_admin/admin."');
    expect(html).toContain('sr-only');
    expect(html).toContain('Approve');
  });

  it('fails closed without a provider', () => {
    expect(renderToStaticMarkup(h(PermissionGate, { can: { module: 'orders', action: 'view' }, children: child }))).toBe('');
  });
});
