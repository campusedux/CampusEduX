import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  MODULES,
  type AdminRole,
  type ModuleKey,
  type ModulePerms,
  type PermAction,
  type PermissionMatrix,
  can,
  permsFor,
} from '@/lib/permissions';

export type { AdminRole } from '@/lib/permissions';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  status: 'active' | 'suspended';
  avatarUrl: string | null;
  /** The role's full permission matrix, ready to hand to the sidebar / UI. */
  perms: PermissionMatrix;
}

/**
 * The one gate every panel page passes through (called in
 * `src/app/(panel)/layout.tsx`). A logged-in Supabase session that has no
 * matching `admin_users` row — or one that's suspended — is bounced straight
 * back to /login. This is in addition to, never instead of, the RLS policies
 * and `has_permission()` checks on every table the panel touches.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: row, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, status, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // `admin_users` missing entirely (migration 001 not applied yet) surfaces as
  // PGRST205 — treat it the same as "not an admin" so the app fails closed.
  if (error && error.code !== 'PGRST205') {
    console.warn('[admin] requireAdmin lookup error:', error.code, error.message);
  }

  if (!row || row.status !== 'active') {
    redirect('/login?error=not_admin');
  }

  const role = row.role as AdminRole;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.email,
    role,
    status: row.status as 'active' | 'suspended',
    avatarUrl: row.avatar_url ?? null,
    perms: await loadPermissions(role),
  };
}

/**
 * The role's live permission matrix. Reads `role_permissions` (edited in
 * Settings → Roles & Permissions) and overlays it on the static defaults from
 * `permissions.ts`, so a module with no DB row keeps its sensible default and
 * the sidebar/UI react to matrix edits without a redeploy. super_admin always
 * gets everything.
 */
export async function loadPermissions(role: AdminRole): Promise<PermissionMatrix> {
  const base = permsFor(role);
  if (role === 'super_admin') return base;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('role_permissions')
    .select('module, can_view, can_add, can_edit, can_delete')
    .eq('role', role);

  if (error || !data || data.length === 0) return base;

  const out = {} as PermissionMatrix;
  const known = new Set(MODULES as readonly string[]);
  for (const m of MODULES) out[m] = { ...base[m] };
  for (const r of data) {
    if (!known.has(r.module)) continue;
    out[r.module as ModuleKey] = {
      view: Boolean(r.can_view),
      add: Boolean(r.can_add),
      edit: Boolean(r.can_edit),
      delete: Boolean(r.can_delete),
    } satisfies ModulePerms;
  }
  return out;
}

/** Like requireAdmin, but also bounces the route if the role can't `view` the module. */
export async function requireModule(module: ModuleKey): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!admin.perms[module]?.view) redirect('/?error=no_access');
  return admin;
}

/**
 * Server-side permission check backed by the DB `has_permission()` function
 * (so a super_admin editing the matrix in Settings takes effect immediately,
 * without a redeploy). Falls back to the static matrix if the function isn't
 * there yet.
 */
export async function hasPermission(module: ModuleKey, action: PermAction): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_module: module,
    p_action: action,
  });

  if (error) {
    // Function not deployed yet — fall back to the role's static defaults.
    const { data: row } = await supabase.from('admin_users').select('role').eq('id', user.id).maybeSingle();
    return row ? can(row.role as AdminRole, module, action) : false;
  }
  return Boolean(data);
}

/** Throws inside a Server Action when the caller lacks a permission. */
export async function requirePermission(module: ModuleKey, action: PermAction): Promise<AdminUser> {
  const admin = await requireAdmin();
  const ok = await hasPermission(module, action);
  if (!ok) {
    throw new Error(`You don't have permission to ${action} in ${module}.`);
  }
  return admin;
}
