'use client';

import type { ReactNode } from 'react';
import type { AdminRole } from '@/lib/permissions';
import { evaluateGate, type PermRequirement } from '@/lib/permission-gate';
import { useAdminPermissions } from '@/components/auth/AdminPermissionsProvider';

/**
 * Hide or disable UI the current admin's role can't use. UX only: the server
 * (requirePermission + DB has_permission/require_admin_role + RLS) enforces.
 *
 *  - mode="hide"    renders nothing (use for "New X" links).
 *  - mode="disable" renders children inside a disabled <fieldset> with a
 *    tooltip (`title`) + aria-disabled + sr-only text explaining why (use for
 *    row actions / forms). Links inside are made non-interactive too.
 */
export function PermissionGate({
  can,
  roles,
  mode = 'hide',
  reason,
  block = false,
  children,
}: {
  can?: PermRequirement | PermRequirement[];
  roles?: readonly AdminRole[];
  mode?: 'hide' | 'disable';
  /** Overrides the generated explanation. */
  reason?: string;
  /** Full-width wrapper for cards/forms instead of inline. */
  block?: boolean;
  children: ReactNode;
}) {
  const { perms, role } = useAdminPermissions();
  const res = evaluateGate(perms, role, { can, roles });
  if (res.allowed) return <>{children}</>;
  if (mode === 'hide') return null;

  const text = reason ?? res.reason;
  return (
    <span title={text} aria-disabled="true" data-permission-denied="" className={block ? 'block cursor-not-allowed' : 'inline-block cursor-not-allowed'}>
      <fieldset
        disabled
        className={`m-0 min-w-0 border-0 p-0 opacity-50 [&_a]:pointer-events-none [&_button]:pointer-events-none ${block ? 'block w-full' : 'inline-block'}`}
      >
        {children}
      </fieldset>
      <span className="sr-only">{text}</span>
    </span>
  );
}
