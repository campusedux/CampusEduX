/**
 * Role → module → {view,add,edit,delete} matrix.
 *
 * This file is the client-side mirror of the `role_permissions` rows seeded by
 * `admin-panel/supabase/migrations/001_admin_core.sql`. It drives:
 *   • sidebar section visibility (hide a nav item the role can't `view`)
 *   • button-level gating in the UI (hide "+ Add", edit/delete icons)
 *
 * Enforcement still happens server-side: every mutating Server Action calls
 * `requirePermission(module, action)` which hits the DB `has_permission()`
 * function, and RLS on every table is the final backstop. Keep the two in sync
 * — if you change a default here, change the migration seed too (and vice
 * versa), then have a super_admin re-save the matrix from Settings → Roles.
 */

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'support' | 'viewer';

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'editor', 'support', 'viewer'];

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  support: 'Support',
  viewer: 'Viewer',
};

/** Every gate-able area. The first 13 map 1:1 to sidebar items; the last 4 are
 *  sub-sections inside Settings that only super_admin ever sees. */
export const MODULES = [
  'dashboard',
  'students',
  'projects',
  'custom_projects',
  'jobs',
  'placement',
  'resume',
  'orders',
  'referrals',
  'cms',
  'reviews',
  'reports',
  'settings',
  'admin_users',
  'roles',
  'backup',
  'system_logs',
] as const;

export type ModuleKey = (typeof MODULES)[number];

export const MODULE_LABEL: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  projects: 'Projects',
  custom_projects: 'Custom Projects',
  jobs: 'Jobs',
  placement: 'Placement Prep',
  resume: 'Resume Builder',
  orders: 'Orders & Payments',
  referrals: 'Referral & Wallet',
  cms: 'Banner & CMS',
  reviews: 'Reviews & Ratings',
  reports: 'Reports',
  settings: 'Settings',
  admin_users: 'Admin Users',
  roles: 'Roles & Permissions',
  backup: 'Backup',
  system_logs: 'System Logs',
};

export type PermAction = 'view' | 'add' | 'edit' | 'delete';

export interface ModulePerms {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMatrix = Record<ModuleKey, ModulePerms>;

const NONE: ModulePerms = { view: false, add: false, edit: false, delete: false };
const V: ModulePerms = { view: true, add: false, edit: false, delete: false };
const VE: ModulePerms = { view: true, add: false, edit: true, delete: false };
const VAE: ModulePerms = { view: true, add: true, edit: true, delete: false };
const ALL: ModulePerms = { view: true, add: true, edit: true, delete: true };

function matrix(fill: ModulePerms, overrides: Partial<Record<ModuleKey, ModulePerms>> = {}): PermissionMatrix {
  const out = {} as PermissionMatrix;
  for (const m of MODULES) out[m] = overrides[m] ?? fill;
  return out;
}

export const DEFAULT_PERMISSIONS: Record<AdminRole, PermissionMatrix> = {
  // Everything, everywhere.
  super_admin: matrix(ALL),

  // Full run of the product, but the four super-admin-only areas stay hidden.
  admin: matrix(ALL, {
    admin_users: NONE,
    roles: NONE,
    backup: NONE,
    system_logs: NONE,
  }),

  // Content management: create/edit catalog + CMS, no deletes, no settings.
  editor: matrix(V, {
    projects: VAE,
    custom_projects: VAE,
    jobs: VAE,
    placement: VAE,
    resume: VAE,
    cms: VAE,
    reviews: VAE,
    settings: NONE,
    admin_users: NONE,
    roles: NONE,
    backup: NONE,
    system_logs: NONE,
  }),

  // Operations desk: works students / orders / refunds / wallet queue /
  // review moderation. No Settings, no Reports (per spec).
  support: matrix(V, {
    students: VE,
    custom_projects: VE,
    orders: VE,
    referrals: VE,
    reviews: VE,
    reports: NONE,
    settings: NONE,
    admin_users: NONE,
    roles: NONE,
    backup: NONE,
    system_logs: NONE,
  }),

  // Read-only across the board; no Add/Edit/Delete buttons anywhere.
  viewer: matrix(V, {
    admin_users: NONE,
    roles: NONE,
    backup: NONE,
    system_logs: NONE,
  }),
};

export function permsFor(role: AdminRole): PermissionMatrix {
  return DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS.viewer;
}

export function can(role: AdminRole, module: ModuleKey, action: PermAction): boolean {
  return Boolean(permsFor(role)[module]?.[action]);
}
