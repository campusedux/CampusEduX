/**
 * Pure (client-safe) permission-gate logic shared by the panel UI.
 *
 * UI gating is UX ONLY. The server is the authority: every Server Action calls
 * `requirePermission(module, action)` (→ DB `has_permission()`), the DB RPCs
 * call `require_admin_role(...)`/`require_permission(...)` and RLS is the final
 * backstop (migration 0119 / admin 091). This file just makes the UI derive its
 * hide/disable decisions from the SAME data (the role's `role_permissions`
 * matrix loaded in `requireAdmin()` → `loadPermissions()`), never a per-role
 * hardcoded list.
 */
import type { AdminRole, ModuleKey, PermAction, PermissionMatrix } from '@/lib/permissions';

/**
 * Roles allowed to call the money/destructive RPCs (`admin_adjust_wallet`,
 * `admin_process_refund`, `admin_process_withdrawal`, `send_bulk_notification`).
 * MIRRORS `require_admin_role(array['super_admin','admin'], ...)` in
 * mobile-app/supabase/migrations/0119_admin_permission_enforcement.sql — a unit
 * test (tests/lib/permission-gate.test.ts) fails if the two diverge.
 */
export const MONEY_RPC_ROLES: readonly AdminRole[] = ['super_admin', 'admin'];

export interface PermRequirement {
  module: ModuleKey;
  action: PermAction;
}

export interface GateSpec {
  /** One requirement, or several that must ALL hold. */
  can?: PermRequirement | PermRequirement[];
  /** Current role must be one of these (RPC role guard, e.g. MONEY_RPC_ROLES). */
  roles?: readonly AdminRole[];
}

/** `role_permissions`-matrix check: can this matrix perform `action` on `module`? */
export function canPerm(
  perms: PermissionMatrix | null | undefined,
  module: ModuleKey,
  action: PermAction,
): boolean {
  return Boolean(perms?.[module]?.[action]);
}

export function roleAllowed(role: AdminRole | null | undefined, roles: readonly AdminRole[]): boolean {
  return !!role && roles.includes(role);
}

export interface GateResult {
  allowed: boolean;
  /** Human explanation when not allowed (tooltip / aria text). */
  reason: string;
}

const roleList = (roles: readonly AdminRole[]) => roles.join('/');

/** Evaluate a gate; fails closed when perms/role are unknown. */
export function evaluateGate(
  perms: PermissionMatrix | null | undefined,
  role: AdminRole | null | undefined,
  spec: GateSpec,
): GateResult {
  const who = role ?? 'unknown';
  if (spec.roles && !roleAllowed(role, spec.roles)) {
    return {
      allowed: false,
      reason: `Your role (${who}) can't do this — needs ${roleList(spec.roles)}.`,
    };
  }
  const reqs = spec.can ? (Array.isArray(spec.can) ? spec.can : [spec.can]) : [];
  for (const r of reqs) {
    if (!canPerm(perms, r.module, r.action)) {
      return {
        allowed: false,
        reason: `Your role (${who}) can't do this — needs ${r.module.replace(/_/g, ' ')}: ${r.action} permission.`,
      };
    }
  }
  return { allowed: true, reason: '' };
}
